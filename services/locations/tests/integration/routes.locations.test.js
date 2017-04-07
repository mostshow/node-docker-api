process.env.NODE_ENV = 'test';

const request = require('request-promise');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/app');
const knex = require('../../src/model/connection');
const queries = require('../../src/model/queries');

describe('Locations API Routes', () => {

  beforeEach(() => {
    return knex.migrate.rollback()
    .then(() => { return knex.migrate.latest(); })
    .then(() => { return knex.seed.run(); });
  });

  afterEach(() => {
    // return knex.migrate.rollback();
  });

  describe.only('GET /locations', () => {
    it('should return all locations', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        chai.request(server)
        .get('/locations')
        .set('authorization', `Bearer ${response.token}`)
        .end((err, res) => {
          res.type.should.equal('application/json');
          res.body.status.should.equal('success');
          res.body.data.should.be.a('array');
          res.body.data.length.should.equal(1);
          res.body.data[0].should.have.property('user_id');
          res.body.data[0].should.have.property('lat');
          res.body.data[0].should.have.property('long');
          res.body.data[0].should.have.property('created_at');
        });
      });
    });
    it('should throw an error if a user is not logged in', (done) => {
      chai.request(server)
      .get('/locations')
      .end((err, res) => {
        should.exist(err);
        res.status.should.eql(400);
        res.type.should.eql('application/json');
        res.body.status.should.eql('Please log in');
        done();
      });
    });
  });
  describe('GET /locations/:id', () => {
    it('should return a single location', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        return queries.getAllLocations()
        .then((locations) => {
          const location = locations[0];
          chai.request(server)
          .get(`/locations/${location.id}`)
          .set('authorization', `Bearer ${response.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.body.status.should.equal('success');
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('id');
            res.body.data.id.should.equal(location.id);
            res.body.data.should.have.property('user_id');
            res.body.data.user_id.should.equal(location.user_id);
            res.body.data.should.have.property('lat');
            res.body.data.lat.should.equal(location.lat);
            res.body.data.should.have.property('long');
            res.body.data.long.should.equal(location.long);
            res.body.data.should.have.property('created_at');
          });
        });
      });
    });
    it('should throw an error if a user is not logged in', () => {
      return queries.getAllLocations()
      .then((locations) => {
        const location = locations[0];
        chai.request(server)
        .get(`/locations/${location.id}`)
        .end((err, res) => {
          should.exist(err);
          res.status.should.eql(400);
          res.type.should.eql('application/json');
          res.body.status.should.eql('Please log in');
        });
      });
    });
  });
  describe('POST /', () => {
    it('should create a new location', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        return queries.getAllLocations()
        .then((locationsBefore) => {
          chai.request(server)
          .post('/locations')
          .set('authorization', `Bearer ${response.token}`)
          .send({
            lat: 46.9,
            long: -47.8,
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.body.should.be.a('object');
            res.body.status.should.equal('success');
            res.body.data.should.equal('Location Added!');
            return queries.getAllLocations()
            .then((locationsAfter) => {
              locationsAfter.length.should.equal(locationsBefore.length + 1);
              locationsAfter[locationsAfter.length - 1].user_id.should.equal(1);
            });
          });
        });
      });
    });
    it('should NOT create a location missing a lat', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        return queries.getAllLocations()
        .then((locationsBefore) => {
          chai.request(server)
          .post('/locations')
          .set('authorization', `Bearer ${response.token}`)
          .send({
            long: 77,
          })
          .end((err, res) => {
            res.should.have.status(500);
            res.type.should.equal('application/json');
            res.body.status.should.equal('error');
            return queries.getAllLocations()
            .then((locationsAfter) => {
              locationsAfter.length.should.equal(locationsBefore.length);
              locationsAfter[locationsAfter.length - 1].lat.should.not.equal(77);
            });
          });
        });
      });
    });
    it('should throw an error if a user is not logged in', () => {
      return queries.getAllLocations()
      .then((locationsBefore) => {
        chai.request(server)
        .post('/locations')
        .send({
          lat: 46.9,
          long: -47.8,
        })
        .end((err, res) => {
          should.exist(err);
          res.status.should.eql(400);
          res.type.should.eql('application/json');
          res.body.status.should.eql('Please log in');
        });
      });
    });
  });
  describe('PUT /:id', () => {
    it('should update a location', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        return queries.getAllLocations()
        .then((locationsBefore) => {
          const locationID = locationsBefore[0].id;
          chai.request(server)
          .put(`/locations/${locationID}`)
          .set('authorization', `Bearer ${response.token}`)
          .send({
            lat: 77,
            long: 77,
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.body.should.be.a('object');
            res.body.status.should.equal('success');
            res.body.data.should.equal('Location Updated!');
            return queries.getSingleLocation(locationID)
            .then((locations) => {
              locations[0].user_id.should.equal(1);
              locations[0].lat.should.equal(77);
              locations[0].long.should.equal(77);
            });
          });
        });
      });
    });
    it('should throw an error if a user is not logged in', () => {
      return queries.getAllLocations()
      .then((locationsBefore) => {
        const locationID = locationsBefore[0].id;
        chai.request(server)
        .put(`/locations/${locationID}`)
        .send({
          lat: 77,
          long: 77,
        })
        .end((err, res) => {
          should.exist(err);
          res.status.should.eql(400);
          res.type.should.eql('application/json');
          res.body.status.should.eql('Please log in');
        });
      });
    });
  });
  describe('DELETE /:id', () => {
    it('should delete a location', () => {
      const payload = {
        username: 'jeremy',
        password: 'johnson123'
      };
      const options = {
        method: 'POST',
        uri: 'http://users-service:3000/users/login',
        body: payload,
        json: true
      };
      return request(options)
      .then((response) => {
        return queries.getAllLocations()
        .then((locationsBefore) => {
          const locationID = locationsBefore[0].id;
          chai.request(server)
          .delete(`/locations/${locationID}`)
          .set('authorization', `Bearer ${response.token}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.body.should.be.a('object');
            res.body.status.should.equal('success');
            res.body.data.should.equal('Location Removed!');
            return queries.getSingleLocation(locationID)
            .then((locations) => {
              locations.length.should.equal(0);
            });
          });
        });
      });
    });
    it('should throw an error if a user is not logged in', () => {
      return queries.getAllLocations()
      .then((locationsBefore) => {
        const locationID = locationsBefore[0].id;
        chai.request(server)
        .delete(`/locations/${locationID}`)
        .end((err, res) => {
          should.exist(err);
          res.status.should.eql(400);
          res.type.should.eql('application/json');
          res.body.status.should.eql('Please log in');
        });
      });
    });
  });

});
