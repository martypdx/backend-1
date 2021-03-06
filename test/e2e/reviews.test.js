const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');
const { verify } = require('../../lib/auth/token-service');

describe('Reviews e2e', () => {

    let _id = null;
    let _id2 = null;
    let reviewId = null;
    let token1 = null;
    let token2 = null;

    let review1 = {
        movieId: '555534465463',
        text: 'A great review',
        category: 'Sound',
        rating: 3,
        user: null,
        title: 'Great Movie',
        description: 'Movie description',
        poster: 'url goes here',
        userName: null
    };

    const checkOk = res => {
        if(!res.ok) throw res.error;
        return res;
    };

    before(() => dropCollection('users'));
    before(() => dropCollection('reviews'));
    before(() => {
        return request
            .post('/api/auth/signup')
            .send({
                email: 'foo@bar.com',
                password: 'foobar',
                name: 'Mr. Foo Bar'
            })
            .then(({ body }) => {
                token1 = body.token;
                review1.userName = body.name;
                return verify(body.token);
            })
            .then(payload => {
                _id = payload.id;
                review1.user = _id;
            });
    
    });

    before(() => {
        return request
            .post('/api/auth/signup')
            .send({
                email: 'noreviews@bar.com',
                password: 'foobar',
                name: 'Mr. No Reviews'
            })
            .then(({ body }) => {
                token2 = body.token;
                return verify(body.token);
            })
            .then(payload => {
                _id2 = payload.id;
            });
           
    });

    it('Posts a Review', () => {
        return request
            .post(`/api/reviews/user/${_id}`)
            .set('Authorization', token1)
            .send(review1)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, {...review1, __v: 0, _id: body._id });
                reviewId = body._id;
            });
    });

    it('Posting a Review that already exists fails', () => {
        return request
            .post(`/api/reviews/user/${_id}`)
            .set('Authorization', token1)
            .send(review1)
            .then(res => {
                assert.equal(res.error.status, 400);
            });
    });

    it('Gets Reviews by User', () => {
        return request
            .get(`/api/reviews/user/${_id}`)
            .set('Authorization', token1)
            .then(({ body }) => {
                assert.deepEqual(body[0], { ...review1, __v: 0, _id: reviewId });
            });
    });

    it('Results back from no reviews by User', () => {
        return request
            .get(`/api/reviews/user/${_id2}`)
            .set('Authorization', token2)
            .then(({ body }) => {
                assert.deepEqual(body, []);
            });
    });

    it('Updates a Review', () => {
        review1.text = 'A even greater review';
        return request
            .put(`/api/reviews/user/${_id}/${reviewId}`)
            .set('Authorization', token1)
            .send(review1)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, {...review1, __v: 0, _id: reviewId });
            });
    });

    it('Gets a review by Review ID', () => {
        return request
            .get(`/api/reviews/detail/${reviewId}`)
            .then(({ body }) => {
                assert.deepEqual(body, {...review1, __v: 0, _id: reviewId });
            });
    });

    it('Deletes a Review', () => {
        return request
            .delete(`/api/reviews/user/${_id}/${reviewId}`)
            .set('Authorization', token1)
            .then(checkOk)
            .then(({ body }) => {
                assert.equal(body, reviewId);
            });
    });

    it('Tries to get reviews, but none by that movieId', () => {
        return request
            .get('/api/reviews/movie/badId')
            .then(({ body }) => {
                assert.deepEqual(body, []);
            });
    });

});