# YGG Torrent transmission auto downloader

This little software will automatically download torrents from YGG torrent and send them to transmission.

You can pass it some words to search for, and it will download torrents that contain those words.

Each time a torrent is downloaded, it will send a notification to PushOver, so you can recive it to all your devices.

The app send a notification when a torrent starts downloading, and when it finishes, so you can keep track of the activity on your media center.

## Installation

Clone the repository to your computer, and install the dependancy using `yarn`:

```sh
yarn
```

You also need to install `transmission`:

```sh
sudo apt update
sudo apt install transmission
```

Create an acount on PushOver, and get your `token` and `user_key`.

Copy the `.env.example` file to `.env` and fill in the values.

Finnaly create a `torrents` folder in the root of the project, and make it writable. This is where the downloaded torrents will be stored.

## Usage

Fill the `trackedMedias` variable with the media you want to search for. Example:
  
  ```js
  trackedMedias = [
    {
      wordsToMatch: ['game', 'of', 'thrones'],
      type: 'tvSerie',
      downloadPath: '/media/hdd/Series',
    },
    {
      wordsToMatch: ['look', 'at', 'me'],
      type: 'documentary',
      downloadPath: '/media/hdd/Docu (films)',
    }
  ]
  ```

`wordsToMatch` is an array of words that the torrent name must contain.

`type` is the type of media you want to search for. It can be `tvSerie` or `documentary`. This will determine witch RSS feed will be used.

`downloadPath` is the path where the torrent will be downloaded. Ensure that the folder exists and is writable by the user.

Launch the app using `yarn start`
