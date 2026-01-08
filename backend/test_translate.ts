
import translate from "google-translate-api-x";

async function test() {
    try {
        const res = await translate("Pembersihan 3 Kamar", { to: "en", autoCorrect: true });
        console.log("Original: Pembersihan 3 Kamar");
        console.log("Translated:", res.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
