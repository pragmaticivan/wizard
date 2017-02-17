import path from 'path';
const glob = require('multi-glob').glob;

/**
 * Wizard lib
 */
class Wizard {

  /**
   * Constructor.
   * @param  {!Object} optConfig
   */
  constructor(optConfig = {}) {
    /**
     * Holds the configuration options.
     * @type {?Object}
     * @protected
     */
    this.options = {
      cwd: process.cwd(),
      logger: console,
      verbose: true,
      loggingType: 'info',
      defaultExclusion: [],
    };

    this.options = Object.assign(this.options, optConfig);

    /**
     * Holds the injection globs.
     * @type {?Array}
     * @default {[]}
     * @protected
     */
    this.injectionGlobs = [];

    /**
     * Holds the injection globs.
     * @type {?Array}
     * @default {[]}
     * @protected
     */
    this.exclusionGlobs = [];

    /**
     * Holds the default processor function.
     * @type {?Function}
     * @default {defaultProcessorFn_}
     * @protected
     */
    this.processorFn = this.defaultProcessorFn_;


    this.loadDefaultExclusion_();

    this.log_(['Initialized in', this.getOptions().cwd]);
  }

  /**
   * Asserts value is defined and not null.
   * @param  {Object} value Value to be checked.
   * @param  {string} errorMessage Error message
   * @private
   */
  assertNotNull_(value, errorMessage) {
    if((value === undefined) || (value === null)) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Creates namespace inside parent object.
   * @param  {!Object} parent Target object where to insert the nested values.
   * @param  {!Array} parts Namespace representation key.
   * @param  {Function|Object} mod Function or object to be
   * inserted into the namespace.
   * @return {Object} parent Returns a parent after recursive
   * namespace creation.
   * @private
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
   * Default processor to perform call of args in a function. It checks if
   * the module has a default attribute in case of es6 exports module.
   * @param {Function|Object} module Module to be processed.
   * @param {Array=} optArgs Arguments to be applyed to the module function.
   * @return {Function|Object} Processed module.
   * @private
   */
  defaultProcessorFn_(module, optArgs) {
    if (module.default) {
      module = module.default;
    }

    if (typeof module === 'function') {
      module = module.apply(module, optArgs);
    }
    return module;
  }

  /**
   * Accumulates glob pattern to be excluded from the main object.
   * @param  {string|string[]} glob
   * @return {Wizard}
   */
  exclude(glob) {
    this.assertNotNull_(glob, 'Glob is required.');

    if (Array.isArray(glob)) {
      Array.prototype.push.apply(this.getExclusionGlobs(), glob);
    } else {
      this.getExclusionGlobs().push(glob);
    }
    return this;
  }

  /**
   * Gets default processor function.
   * @return {Function} Default processor function.
   */
  getDefaultProcessorFn() {
    return this.defaultProcessorFn_;
  }

  /**
   * Returns module manipulation processor.
   * @return {Function} Processor function
   */
  getProcessorFn() {
    return this.processorFn;
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
      this.getInjectionGlobs().push(glob);
    } else {
      this.getInjectionGlobs().push([glob]);
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
    this.processorFn = processorFn;
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
   * Get exclusion globs.
   * @return {Array} Exclusion globs.
   */
  getExclusionGlobs() {
    return this.exclusionGlobs;
  }

  /**
   * Get files.
   * @return {Promise} Returns a promise with the grouped files.
   */
  async getFiles() {
    let groupedFiles = [];

    for (let globPattern of this.getInjectionGlobs()) {
      let files = await this.getGlobFile(globPattern);
      groupedFiles.push(files);
    }

    return groupedFiles;
  }

  /**
   * Concatenates cwd directory from options with the file name.
   * @param  {string} file Target file.
   * @return {string} Returns full patch.
   */
  getFullPath_(file) {
    return `${this.getOptions().cwd}/${file}`;
  }

  /**
   * Get files based on provided glob.
   * @param  {Array|string} pattern Pattern used to locate
   * files using glob module.
   * @return {Promise} Returns promise with the files found in the processing.
   */
  getGlobFile(pattern) {
    return new Promise((resolve, reject) => {
      const options = {
        ignore: this.getExclusionGlobs(),
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
  getInjectionGlobs() {
    return this.injectionGlobs;
  }

  /**
   * Get options.
   * @return {Object}
   */
  getOptions() {
    return this.options;
  }

  /**
   * Get relative path.
   * @param  {string} file Target file to concatenate with relative path.
   * @return {string} Relative path.
   * @private
   */
  getRelativePath_(file) {
    return '.' + this.getFullPath_(file).split(this.getOptions().cwd).pop();
  }
}

export default Wizard;
