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

## Usage

Fill the `wordsToMatch` variable with the words you want to search for.

Example : if `wordsToMatch=["game", "of", "thrones"]` then the app will download torrents found on the RSS feed that contain "game", "of" AND "thrones".

Launch the app using `yarn start`


