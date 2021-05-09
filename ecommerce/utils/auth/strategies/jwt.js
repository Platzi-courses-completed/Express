const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const boom = require("@hapi/boom");

const config = require("../../../config/index");
const MongoLib = require("../../../lib/mongo");

passport.use(
  new Strategy(
    {
      secretOrKey: config.authJwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async function (tokenPayload, cb) {
      const mongoDB = new MongoLib();

      try {
        const [user] = await mongoDB.getAll("users", {
          username: tokenPayload.sub,
        });

        if (!user) {
          return cn(boom.unauthorized(), false);
        }

        return cb(null, user);
      } catch (e) {
        return cb(e);
      }
    }
  )
);
