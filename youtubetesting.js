import youtubeMp3Converter from "youtube-mp3-converter";
const convertLinkToMp3 = youtubeMp3Converter("./")(
  "https://www.youtube.com/watch?v=p5GQSf1gxbk",
  { title: "0" }
).then(() => {
  console.log("Just finished saving hello.mp3");
});
// const pathToMp3 = await convertLinkToMp3(
// "https://www.youtube.com/watch?v=p5GQSf1gxbk",
// {
// title: "hello",
// }
// ).then(() => {
// console.log("Just finished saving hello.mp3");
// });
