import path from 'path';
const glob = require('multi-glob').glob;

/**
 * Wizard lib
 */
class Wizard {

  /**
   * Constructor.
   * @param  {Object} optConfig
   *
   * TODO: Add support to "base object namespace"
   */
  constructor(optConfig) {
    this.options_ = {
      cwd: process.cwd(),
      logger: console,
      verbose: true,
      loggingType: 'info',
      defaultExclusion: [],
    };

    optConfig = optConfig || {};

    this.mergeOptions_(optConfig);

    this.injection_ = [];
    this.exclusion_ = [];

    this.loadDefaultExclusion();
  }

  /**
   * Inject glob pattern.
   * @param  {string} glob
   * @return {Wizard}
   */
  inject(glob) {
    if (!glob) {
      throw new Error('Param is required.');
    }

    if (Array.isArray(glob)) {
      this.getInjection().concat(glob);
    } else {
      this.getInjection().push(glob);
    }

    return this;
  }

  /**
   * Exclude glob pattern.
   * @param  {string} glob
   * @return {Wizard}
   */
  exclude(glob) {
    if (!glob) {
      throw new Error('Param is required.');
    }

    if (Array.isArray(glob)) {
      this.getExclusion().concat(glob);
    } else {
      this.getExclusion().push(glob);
    }

    return this;
  }

  /**
   * Merge Options.
   * @param  {Object} optConfig;
   */
  mergeOptions_(optConfig) {
    this.options_ = Object.assign(this.options_, optConfig);
  }

  /**
   * Load default glob for exclusion.
   * @return {Wizard}
   */
  loadDefaultExclusion() {
    const defaultExclusion = this.getOptions().defaultExclusion;

    if (defaultExclusion.length > 0) {
      return this.exclude(defaultExclusion);
    }

    return this;
  }

  /**
   * Target where the files are going to be in jected.
   * @param  {Object} obj
   * @return {Promise}
   */
  into(obj) {
    return this.getFiles()
      .then((files) => {
        if (files.length <= 0) {
          return;
        }

        files.forEach( (f) => {
          let loopFile = f;

          delete require.cache[loopFile];

          let args = [];
          let parts = this.getRelativePath_(loopFile).split(path.sep).slice(1);
          let mod = require(this.getFullPath_(loopFile));

          // Handle ES6 default exports (ie. named export called default)
          if (mod.default) {
            mod = mod.default;
          }

          arguments.forEach((a) => {
            args.push(a);
          });

          if (typeof mod === 'function') {
            mod = mod.apply(mod, args);
          }

          this.createNamespace_(obj, parts, mod);
        });
      });
  }

  /**
   * Creates namespace.
   * @param  {Object} parent
   * @param  {Array} parts
   * @param  {Function|Object} mod
   * @return {Object}
   *
   * TODO: review .length usage.
   */
  createNamespace_(parent, parts, mod) {
    let part = parts.shift();

    if (!parent[part]) {
      parent[this.getKeyName_(part)] = parts.length ? {} : mod;
    }

    if (parts.length) {
      parent = this.createNamespace_(parent[part], parts, mod);
    }

    return parent;
  }

  /**
   * Gets keyname removing excension if required.
   * @param  {string} name
   * @return {string}
   */
  getKeyName_(name) {
    return path.basename(name, path.extname(name));
  }

  /**
   * Get exclusion.
   * @return {Array}
   */
  getExclusion() {
    return this.exclusion_;
  }

  /**
   * Get files.
   * @return {Promise}
   */
  getFiles() {
    const options = {
      ignore: this.getExclusion(),
      cwd: this.getOptions().cwd,
    };

    return new Promise((resolve, reject) => {
      glob(this.getInjection(), options, (err, files) => {
        err === null ? resolve(files) : reject(err);
      });
    });
  }

  /**
   * Get files to be inject.
   * @return {Array}
   */
  getInjection() {
    return this.injection_;
  }

  /**
   * Get options.
   * @return {Object}
   */
  getOptions() {
    return this.options_;
  }

  /**
   * Get full file path.
   * @param  {string} file
   * @return {string}
   */
  getFullPath_(file) {
    return `${this.getOptions().cwd}/${file}`;
  }

  /**
   * Get relative path.
   * @param  {string} file
   * @return {string}
   */
  getRelativePath_(file) {
    return '.' + this.getFullPath_(file).split(this.getOptions().cwd).pop();
  }
}

export default Wizard;
