import { milliseconds } from "./utils/time";

const main = async () => {
    console.log("first");

    await milliseconds(1000);
    console.log("second");
};

main();