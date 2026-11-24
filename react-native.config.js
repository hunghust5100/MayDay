const { readFirebaseConfig } = require('./scripts/firebase-config.cjs');

const { android, ios } = readFirebaseConfig();
const platforms = {
  ...(android ? {} : { android: null }),
  ...(ios ? {} : { ios: null }),
};

module.exports = {
  dependencies: {
    '@react-native-firebase/app': { platforms },
    '@react-native-firebase/messaging': { platforms },
  },
};
