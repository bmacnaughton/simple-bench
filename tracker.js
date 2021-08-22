/**
 * Tracker for objects we want to persist contrastProperties for.
 *
 * @module lib/tracker
 */
'use strict';

const logger = () => null;
const distringuish = require('@contrast/distringuish-prebuilt');

const defaultContrastProperties = {
  get tracked() {
    return false;
  },
  set tracked(arg) {
    logger.warn('tracked assigned to default contrastProperties');
  },
  get tagRanges() {
    logger.warn('tagRanges referenced from default contrastProperties');
    return [];
  },
  set tagRanges(arg) {
    logger.warn('tagRanges assigned to default contrastProperties');
  },
  get event() {
    logger.warn('event referenced from default contrastProperties');
    return null;
  },
  set event(arg) {
    logger.warn('event assigned to default contrastProperties');
  }
};

// NOTE: this function just exists for us to get a better view
// of the module's performance while profiling
function getExtStringProps(ext) {
  return distringuish.getProperties(ext);
}

// i'm not sure why this is a class. there are no methods, and externalized
// strings don't have an instance of the class; they have an object with the
// same property names.
class ContrastProperties {
  constructor() {
    this.event = null;
    this.tagRanges = [];
    this.tracked = true;
  }
  // this is used to populate the object created by externalize2.
  static populate(obj) {
    obj.event = null;
    obj.tagRanges = [];
    obj.tracked = true;
  }
}

class Tracker {
  constructor() {
    // map target --> ContrastProperties
    this.metadata = new WeakMap();
  }

  /**
   * Map lookup for metadata of a value
   *
   * @param {*} value Tracked value
   * @return {ContrastProperties|undefined}
   */
  getData(value) {
    if (typeof value === 'string') {
      const props = getExtStringProps(value);
      if (props == null) {
        return defaultContrastProperties;
      }

      return props;
    }
    return this.metadata.get(value) || defaultContrastProperties;
  }

  /**
   * Resets a string's tracking metadata to the default contrast properties.
   * This will effectively untrack the associated string, but it will still be
   * the externalized value.
   * @param {object} trackingData A tracked string's metadata
   */
  untrack(str) {
    const trackingData = this.getData(str);
    if (trackingData.tracked) {
      Object.assign(trackingData, defaultContrastProperties);
    }
  }

  trackString(str) {
    if (str.length === 0) {
      return str;
    }

    // XXX: this is the closest we have to a dedup.
    // it may be kind of expensive. we need to consider whether or not
    // this is worthwhile
    if (this.getData(str).tracked) {
      return str;
    }

    const ext = distringuish.externalize(str);

    // XXX this was causing SourceEvent not to get GC'd, for some reason
    // const data = new ContrastProperties(ext, parent, sourceType, parentKey);
    const data = new ContrastProperties();
    const props = distringuish.getProperties(ext);
    Object.assign(props, data);

    return ext;
  }

  trackStringObject(value) {
    if (value.length === 0) {
      return value;
    }

    // no duplicates
    if (this.metadata.has(value)) {
      return value;
    }

    this.metadata.set(value, new ContrastProperties());

    return value;
  }

  // trackArray(value, parent, sourceType, parentKey) {}

  /**
   * Associate properties with a string.
   *
   * @param   {*} value value to track
   * @returns {*}       the value - tracked if some type of string, otherwise untracked
   */
  track(value) {
    if (typeof value === 'string') {
      return this.trackString(value);
    }

    if (value instanceof String) {
      return this.trackStringObject(value);
    }

    return value;
  }

  /**
   * Associate properties with a string. Returns an error if str is not a string,
   * is a zero-length string, or any internal error takes place. track2 uses
   * externalize2.
   *
   * This behavior is different than track in that it requires the caller to check
   * the return value. track always returned properties even if the value was not a
   * string or there were no properties associated with the string value.
   *
   * @param {*} str a value to track.
   * @returns {Object|null} {str, props} or null on error.
   */
  track2(str) {
    if (typeof str === 'string') {
      // is the string already tracked?
      let props = distringuish.getProperties(str);
      if (props) {
        return {str, props};
      }
      // return {str, props} or null on error.
      str = distringuish.externalize(str);
      if (!str) {
        return null;
      }
      props = distringuish.getProperties(str);
      if (!props) {
        return null;
      }
      ContrastProperties.populate(props);
      return {str, props};
    }

    if (str instanceof String) {
      // no duplicates
      let props = this.metadata.get(str);
      if (props) {
        return { str, props };
      }

      props = new ContrastProperties();
      this.metadata.set(str, props);

      return { str: props };
    }

    return null;
  }

  /**
   * Return the properties associated with a value or null.
   *
   * @param {*} str any value
   * @return {ContrastProperties|null}
   */
  getData2(str) {
    if (typeof str === 'string') {
      return distringuish.getProperties(str);
    }
    if (str instanceof String) {
      return this.metadata.get(str) || null;
    }
    return null;
  }
}

const tracker = new Tracker();
module.exports = tracker;
module.exports.Tracker = Tracker;
module.exports.defaultContrastProperties = defaultContrastProperties;
