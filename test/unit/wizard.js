import Wizard from '../../src/wizard';
import path from 'path';

describe('Wizard', function() {
  describe('config', function() {
    let cwd = path.resolve('test/fixtures/module_files');
    let verbose = false;

    it('should set verbose to false', function() {
      const optParams = {
        verbose: false,
      };

      const wizard = new Wizard(optParams);

      expect(wizard.getOptions().verbose).to.equal(false);
    });

    it('should set a custom logger', function() {
      const logger = {foo: true, info: function() {}};
      const instance = new Wizard({logger: logger, verbose: verbose});
      return 'foo' in instance.getOptions().logger;
    });

    it('should set the working directory to `'+ cwd +'`', function() {
      const instance = new Wizard({cwd: cwd, verbose: verbose});
      expect(instance.getOptions().cwd).to.equal(cwd);
    });

    it('should load default exclusion into exclusion list', function() {
      const instance = new Wizard({cwd: cwd,
                                   verbose: verbose,
                                   defaultExclusion: ['foo.js']});
      expect(instance.getExclusion()).to.deep.equal(['foo.js']);
    });
  });

  describe('logging', function() {
    it('should log when verbose is true', function() {
      const cwd = path.resolve('test/fixtures/module_files');
      stub(console, 'info');
      new Wizard({cwd: cwd, verbose: true});
      const calledWith = console.info // eslint-disable-line no-console
                                .calledWith(`Initialized in ${cwd}`); // eslint-disable-line  max-len
      expect(calledWith).to.be.true;
    });
  });

  describe('#inject', function() {
    it('should add a glob pattern to inject one file', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const file = ['test/fixtures/root_files/foo.js'];

      instance.inject('test/fixtures/root_files/foo.js');

      expect([file]).to.deep.equal(instance.getInjection());
    });

    it('should add a glob pattern to inject one file using array', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const file = ['test/fixtures/root_files/foo.js'];

      instance.inject(['test/fixtures/root_files/foo.js']);

      expect([file]).to.deep.equal(instance.getInjection());
    });

    it('should inject all the files in the module_files app', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const files = [
              ['test/fixtures/module_files/model/**/*.js'],
              ['test/fixtures/module_files/controller/**/*.js'],
            ];

      instance.inject('test/fixtures/module_files/model/**/*.js')
              .inject('test/fixtures/module_files/controller/**/*.js');

      expect(files).to.deep.equal(instance.getInjection());
    });

    it('should thrown an error if glob is not provided', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});

      expect(function() {
         instance.inject();
      }).to.throw('Glob is required.');
    });
  });

  describe('#exclude', function() {
    it('should add a glob pattern to exclude one file', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const file = 'test/fixtures/root_files/foo.js';

      instance.exclude('test/fixtures/root_files/foo.js');

      expect([file]).to.deep.equal(instance.getExclusion());
    });

    it('should add a glob pattern to exclude one file using array', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const file = 'test/fixtures/root_files/foo.js';

      instance.exclude(['test/fixtures/root_files/foo.js']);

      expect([file]).to.deep.equal(instance.getExclusion());
    });

    it('should exclude all the files in the module_files app', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const files = [
              'test/fixtures/module_files/model/**/*.js',
              'test/fixtures/module_files/controller/**/*.js',
            ];

      instance.exclude('test/fixtures/module_files/model/**/*.js')
              .exclude('test/fixtures/module_files/controller/**/*.js');

      expect(files).to.deep.equal(instance.getExclusion());
    });

    it('should thrown an error if glob is not provided', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});

      expect(function() {
         instance.exclude();
      }).to.throw('Glob is required.');
    });
  });

  describe('#into', function() {
    let cwd = path.resolve('test/fixtures/module_files');
    const verbose = false;

    it('should load the module_files app files', async () => {
      const instance = new Wizard({verbose: verbose, cwd: cwd});
      let app = {};

      await instance.inject('model/**/*.js')
                    .inject('controller/**/*.js')
                    .into(app);

      ['module1', 'module2'].map((file) => {
        expect(typeof app.model[file]).to.equal('function');
        expect(typeof app.controller[file]).to.equal('function');
      });
    });

    it('should load the files inside the model folder', async () => {
      const instance = new Wizard({verbose: verbose, cwd: cwd});
      let app = {};

      await instance.inject('model/**/*.js')
        .into(app);

      ['module1', 'module2'].map((file) => {
        expect(typeof app.model[file]).to.equal('function');
      });

      expect(app.controllers).to.equal(undefined);
    });

    it('should be able to perform a script', async () => {
      const instance = new Wizard({verbose: verbose, cwd: cwd});
      let app = {};

      await instance.inject('controller/**/*.js')
        .into(app, app, true);

      expect(app.controller.module1.execute).to.equal(true);
    });

    it('should not update fake app if there\'s no injected files', async () => {
      const instance = new Wizard({verbose: verbose, cwd: cwd});
      let app = {};

      await instance.into(app);

      expect(app).to.deep.equal({});
    });

    it('should be able to load a file using export default', async () => {
      const customCwd = path.resolve('test/fixtures/module_es6');
      const instance = new Wizard({verbose: verbose, cwd: customCwd});
      let app = {};

      await instance.inject('service.js').into(app);

      expect(typeof app['service']).to.equal('function');
    });
  });

  describe('#setProcessor', () => {
    let cwd = path.resolve('test/fixtures/module_files');
    const verbose = false;

    it('it should replace the default processor and create custom actions for each module', async() => { // eslint-disable-line  max-len
      const instance = new Wizard({verbose: verbose, cwd: cwd});
      let app = {};

      stub(console, 'info');

      let customFunction = (mod, optArgs) => {
        console.info(optArgs);// eslint-disable-line no-console
      };

      instance.setProcessor(customFunction);

      await instance.inject('controller/**/*.js').into(app, app);

      expect(console.info.calledTwice) // eslint-disable-line no-console
        .to.be.true;
    });
  });
});
