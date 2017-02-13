import path from 'path';
import fs from 'fs';
const glob = require('multi-glob').glob;

/**
 * Wizard lib
 */
class Wizard {

  /**
   * Constructor.
   * @param  {Object} optConfig
   */
  constructor(optConfig = {}) {
    this.options_ = {
      cwd: process.cwd(),
      logger: console,
      verbose: true,
      loggingType: 'info',
      defaultExclusion: [],
    };

    this.mergeOptions_(optConfig);

    this.injection_ = [];
    this.exclusion_ = [];

    this.loadDefaultExclusion_();

    this.log_(['Initialized in', this.getOptions().cwd]);
  }

  /**
   * Accumulate glob pattern to be inserted into the main object.
   * @param  {string} glob
   * @return {Wizard}
   */
  inject(glob) {
    if (!glob) {
      throw new Error('Glob is required.');
    }

    if (Array.isArray(glob)) {
      this.getInjection().push(glob);
    } else {
      this.getInjection().push([glob]);
    }

    return this;
  }

  /**
   * Accumulates glob pattern to be excluded from the main object.
   * @param  {string} glob
   * @return {Wizard}
   */
  exclude(glob) {
    if (!glob) {
      throw new Error('Glob is required.');
    }

    if (Array.isArray(glob)) {
      Array.prototype.push.apply(this.getExclusion(), glob);
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
  loadDefaultExclusion_() {
    const defaultExclusion = this.getOptions().defaultExclusion;

    if (defaultExclusion.length > 0) {
      return this.exclude(defaultExclusion);
    }

    return this;
  }

  /**
   * Target where the files are going to be injected.
   * @param {Object} obj
   * @param {[]} optArgs
   * @return {Promise}
   */
  async into(obj, ...optArgs) {
    let files = [];
    try {
      files = await this.getFiles();
    } catch(e) {
      return Promise.reject(e);
    }

    return new Promise((resolve, reject) => {
      if (files.length <= 0) {
        resolve([]);
      }

      try {
        this.processInjectionGroup_(files, obj, optArgs);
      } catch(e) {
        reject(e);
      }

      return resolve();
    });
  }

  /**
   * Process injection group
   * @param  {Array} files
   * @param  {Object} obj
   * @param  {Array} optArgs
   */
  processInjectionGroup_(files, obj, optArgs) {
    files.forEach(async (fileGroup) => {
      await this.processInjection_(fileGroup, obj, optArgs);
    });
  }

  /**
   * Process file injection.
   * @param  {string[]} fileGroup
   * @param  {Object} obj
   * @param  {string[]} optArgs
   * @return {Object}
   */
  processInjection_(fileGroup, obj, optArgs) {
    return new Promise((resolve, reject) => {
      fileGroup.forEach( (f) => {
        try {
          let loopFile = f;

          delete require.cache[this.getFullPath_(loopFile)];

          let args = [];
          let parts = this.getRelativePath_(loopFile).split(path.sep).slice(1);
          if (!fs.existsSync(this.getFullPath_(loopFile))) {
            this.log_(['File not found:', this.getFullPath_(loopFile)]);
            return;
          }
          let mod = require(this.getFullPath_(loopFile));

          if (mod.default) {
            mod = mod.default;
          }

          args.push(obj);

          optArgs.forEach((arg) => {
            args.push(arg);
          });

          if (typeof mod === 'function') {
            mod = mod.apply(mod, args);
          }

          this.log_(['+', this.getRelativePath_(loopFile)], 'info');

          this.createNamespace_(obj, parts, mod);
        } catch(e) {
          reject(e);
        }

        resolve(obj);
      });
    });
  }

  /**
   * Creates namespace.
   * @param  {Object} parent
   * @param  {Array} parts
   * @param  {Function|Object} mod
   * @return {Object}
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
  async getFiles() {
    let groupedFiles = [];

    for (let globPattern of this.getInjection()) {
      let files = await this.getGlobFile(globPattern);
      groupedFiles.push(files);
    }

    return groupedFiles;
  }

  /**
   * Get files based on glob
   * @param  {Array|String} pattern
   * @return {Promise}
   */
  getGlobFile(pattern) {
    const options = {
      ignore: this.getExclusion(),
      cwd: this.getOptions().cwd,
    };

    return new Promise((resolve, reject) => {
      glob(pattern, options, (err, files) => {
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
   * Logs using default logger
   * @param  {string} message
   * @param  {string} type
   * @return {Wizard}
   */
  log_(message, type) {
    if (this.getOptions().verbose) {
      this.getOptions()
          .logger[type || this.getOptions().loggingType](message.join(' '));
    }

    return this;
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
