import Parser from 'rss-parser';
import axios from 'axios';
import fs from 'fs';
import Transmission from 'transmission';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

// Instantiate the rss parser
let parser = new Parser()

const transmission = new Transmission(
  {
    host: process.env.TRANSMISSION_HOST,
    port: process.env.TRANSMISSION_PORT,
    username: process.env.TRANSMISSION_USERNAME,
    password: process.env.TRANSMISSION_PASSWORD,
  }
);

const rssUrls = {
  tvSerie: process.env.RSS_SERIES_URL,
  documentary: process.env.RSS_DOCUMENTARY_URL
};
const pushoverCreds = {
  token: process.env.PUSHOVER_TOKEN,
  user: process.env.PUSHOVER_USER,
}

/**
 * Contain all the media to track and witch RSS feed to use
 * @type {{ wordsToMatch: String[], type: 'tvSerie'|'documentary' }[]}
 */
const trackedMedias = [
  {
    wordsToMatch: ['le', 'flambeau'],
    type: 'tvSerie',
    downloadPath: '/media/hdd/Series',
  },
  {
    wordsToMatch: ['look', 'at', 'me'],
    type: 'documentary',
    downloadPath: '/media/hdd/Docu (films)',
  },
];

const dataFileName = './data.json';

const getFeed = async () => {
  // Get only the nessesary rss feed in function of the tracked media type
  const rssFeedsNames = [...new Set(trackedMedias.map(media => media.type))];
  const rssFeedsUrls = rssFeedsNames.map(rssFeedName => rssUrls[rssFeedName]);

  rssFeedsNames.forEach((rssFeedName) => {
    try {
      const feed = await parser.parseURL(rssFeedsUrls[rssFeedsNames.indexOf(rssFeedName)]);
      const concernedMedias = trackedMedias.filter(media => media.type === rssFeedName);
      feed.items.forEach((item) => {
        const { title } = item;
        const link = item.link.trim();
        const torrentUrl = item.enclosure.url;

        concernedMedias.forEach((concernedMedia) => {
          if (stringContainsAllWords(item.title, concernedMedia.wordsToMatch)) {
            if (!isNotificationAlreadySent(item.link)) {
              console.log(`${concernedMedia.wordsToMatch} found in ${concernedMedia.type}`);
              downloadTorrent(torrentUrl, concernedMedia.downloadPath, title.replace(/[^a-zA-Z0-9.\- ]/g, ""), link);
              addNotificationToDataFile(link);
            }
          }
        });
      });
    } catch (error) {
      console.error(error);
      console.log('ERROR');
    }
  });
}

const sendNotification = async (title, message, link) => {
  try {
    const res = await axios.post('https://api.pushover.net/1/messages.json', {
      ...pushoverCreds,
      title,
      message,
      url: link,
    });
  } catch (error) {
    console.error(error);
    console.log('ERROR');
  }
}

/**
 * Test if all the provided words are in the string
 * @param {String} stringToTest The sting to test
 * @param {Array<String>} wordArrayToMatch The array of words to match with the string
 * @returns {Boolean} `true` if the string contains all words of the array
 */
const stringContainsAllWords = (stringToTest, wordArrayToMatch) => {
  let isContainsAllWords = true;
  wordArrayToMatch.forEach(word => {
    if (!stringToTest.toLowerCase().includes(word.toLowerCase())) {
      isContainsAllWords = false;
    }
  });
  return isContainsAllWords;
}

/**
 * Read the data from the json file
 * @returns {Promise<Object>} Returns the data of the file or a empty object if the file dose not exist.
 */
const readDataFile = () => {
  if (!fs.existsSync(dataFileName)) {
    return {};
  } else {
    return JSON.parse(fs.readFileSync(dataFileName));
  }
};

/**
 * Save the data to a (new) json file
 * @param {Object} data The data to save
 * @returns {Promise}
 */
const saveDataFile = (data) => new Promise((resolve, reject) => {
  fs.writeFileSync(dataFileName, JSON.stringify(data), (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

// Check if a notification has already been sent
const isNotificationAlreadySent = (torrentUrl) => {
  const data = readDataFile();
  if (data.notifications?.includes(torrentUrl)) {
    return true;
  }
  return false;
}

// Add a new object to the alreadySentNotifications file
const addNotificationToDataFile = (torrentUrl) => {
  const data = readDataFile();
  if (data.notifications) {
    data.notifications.push(torrentUrl);
  } else {
    data.notifications = [torrentUrl];
  }
  saveDataFile(data);
}

// Download the torrent file from the torrent url and launch the transmission download process
const downloadTorrent = (torrentUrl, downloadPath, torrentName, yggLink) => {
  const file = fs.createWriteStream(`./torrents/${torrentName}`);
  https.get(torrentUrl, (response) => {
    response.pipe(file);
    console.log(`Torrent file for ${torrentName} downloading...`);

    file.on('finish', () => {
      file.close();
      console.log(`Torrent file for ${torrentName} downloaded`);
      addTorrentToTransmission(`./torrents/${torrentName}`, downloadPath, torrentName, yggLink);
    });
  });
}

// Add a torrent to transmission & watch for the download completion
const addTorrentToTransmission = (torrentPath, downloadPath, torrentName, yggLink) => {
  transmission.addFile(torrentPath, { 'download-dir': downloadPath }, (err, result) => {
    console.log(result);
    console.log(`Torrent for ${torrentName} added`);
    if (err) {
      console.log(err);
    } else {
      sendNotification('Torrent added 📨', `${torrentName} started downloading`, yggLink);
      transmission.waitForState(result.id, 'SEED', (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`Torrent for ${torrentName} finised downloading`);
          sendNotification('Torrent downloaded ✅', `${torrentName} downloaded`, yggLink);
        }
      });
    }
  });
}

getFeed();
setInterval(() => {
  getFeed();
}, 30000);
