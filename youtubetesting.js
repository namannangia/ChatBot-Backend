import youtubeMp3Converter from "youtube-mp3-converter";

const pathToSaveFiles = "./";

const convertLinkToMp3 = youtubeMp3Converter(pathToSaveFiles);

const pathToMp3 = await convertLinkToMp3(
  "https://www.youtube.com/watch?v=qqGadG0IBKY",
  {
    startTime: "00:00:00", // from where in the video the mp3 should start
    // duration: 20, // Length of mp3 in seconds (from start point)
    title: "hello", // The tile of the mp3 file, undefined it takes the youtube title
  }
);
