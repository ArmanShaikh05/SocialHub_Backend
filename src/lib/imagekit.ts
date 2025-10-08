import ImageKit from "imagekit";
import env from "../config/config.js";

const imagekit = new ImageKit({
  privateKey: env.IMAGEKIT_PRIVATE_API_KEY,
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export default imagekit;
