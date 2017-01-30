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
  });

  describe('inject', function() {
    it('should add a glob pattern to inject one file', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const file = 'test/fixtures/root_files/foo.js';

      instance.inject('test/fixtures/root_files/foo.js');

      expect([file]).to.deep.equal(instance.getInjection());
    });

    it('should inject all the files in the module_files app', function() {
      const verbose = false;
      const instance = new Wizard({verbose: verbose});
      const files = [
        'test/fixtures/module_files/model/**/*.js',
        'test/fixtures/module_files/controller/**/*.js',
      ];

      instance.inject('test/fixtures/module_files/model/**/*.js')
              .inject('test/fixtures/module_files/controller/**/*.js');

      expect(files).to.deep.equal(instance.getInjection());
    });
  });
});
