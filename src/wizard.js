import path from 'path';
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

    this.processorFn_ = this.defaultProcessorFn_;

    this.loadDefaultExclusion_();

    this.log_(['Initialized in', this.getOptions().cwd]);
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
   * Default processor to perform call of args in a function.
   * @param {Function|Object} mod
   * @param {Array} optArgs
   * @return {Function|Object}
   */
  defaultProcessorFn_(mod, optArgs) {
    if (mod.default) {
      mod = mod.default;
    }

    if (typeof mod === 'function') {
      mod = mod.apply(mod, optArgs);
    }
    return mod;
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
   * Returns module manipulation processor.
   * @return {Function}
   */
  getProcessorFn() {
    return this.processorFn_;
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
   * Target where the files are going to be injected.
   * @param {Object} obj
   * @param {[]} optArgs
   * @return {Promise}
   */
  async into(obj, ...optArgs) {
    let files = await this.getFiles();

    if (files.length === 0) {
      return [];
    }

    files.forEach((
      fileGroup) => this.processInjection_(fileGroup, obj, optArgs));

    return files;
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
   * Merge Options.
   * @param  {Object} optConfig;
   */
  mergeOptions_(optConfig) {
    this.options_ = Object.assign(this.options_, optConfig);
  }

  /**
   * Process file injection.
   * @param  {string[]} fileGroup
   * @param  {Object} obj
   * @param  {string[]} optArgs
   */
  processInjection_(fileGroup, obj, optArgs) {
    fileGroup.forEach((loopFile) => {
      delete require.cache[this.getFullPath_(loopFile)];

      let parts = this.getRelativePath_(loopFile).split(path.sep).slice(1);
      let mod = require(this.getFullPath_(loopFile));

      if(this.getProcessorFn()) {
        let processor = this.getProcessorFn();
        mod = processor(mod, optArgs);
      }

      this.log_(['+', this.getRelativePath_(loopFile)], 'info');

      this.createNamespace_(obj, parts, mod);
    });
  }

  /**
   * Sets module manipulation processor.
   * @param {Function} processorFn
   */
  setProcessorFn(processorFn) {
    this.processorFn_ = processorFn;
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
   * Get full file path.
   * @param  {string} file
   * @return {string}
   */
  getFullPath_(file) {
    return `${this.getOptions().cwd}/${file}`;
  }

  /**
   * Get files based on glob
   * @param  {Array|String} pattern
   * @return {Promise}
   */
  getGlobFile(pattern) {
    return new Promise((resolve, reject) => {
      const options = {
        ignore: this.getExclusion(),
        cwd: this.getOptions().cwd,
      };

      glob(pattern, options, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
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
   * Get relative path.
   * @param  {string} file
   * @return {string}
   */
  getRelativePath_(file) {
    return '.' + this.getFullPath_(file).split(this.getOptions().cwd).pop();
  }
}

export default Wizard;
