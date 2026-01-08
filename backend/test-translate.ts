
import translate from "google-translate-api-x";

async function test() {
  try {
    const res = await translate("Halo dunia", { to: "en" });
    console.log("Translation result:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
