const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('../config/database');
// const UserService = require('../Services/UserService');


module.exports = (passport) => {
    let opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
        // UserService.getUser({_id: jwt_payload.data.user_id}, (err, user) => {
        //     if (err) return done(err, false);
        //     if (user) return done(null, user);
        //     return done(null, false);
        // });
    }));
};
