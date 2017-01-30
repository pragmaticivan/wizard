import supertest from 'supertest';
import chai from 'chai';
import app from '../src/feather';

global.config = config;
global.expect = chai.expect;
