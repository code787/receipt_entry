"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_vite = require("vite");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
var geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  if (!geminiClient) {
    geminiClient = new import_genai.GoogleGenAI({ apiKey });
  }
  return geminiClient;
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const ai = getGeminiClient();
    const prompt = `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u8D85\u5E02/\u5546\u573A\u5C0F\u7968\u667A\u80FD\u8BC6\u522B\u7CFB\u7EDF\u3002
\u8BF7\u4ED4\u7EC6\u8BC6\u522B\u8FD9\u5F20\u5C0F\u7968\u56FE\u7247\u4E2D\u7684\u6240\u6709\u771F\u5B9E\u4FE1\u606F\uFF0C\u5E76\u8F93\u51FA\u7ED3\u6784\u5316 JSON \u6570\u636E\u3002

\u91CD\u70B9\u6CE8\u610F\u89C4\u907F\u865A\u5047\u8BC6\u522B\u548C\u80CC\u666F\u5E72\u6270\uFF1A
1. \u80CC\u666F\u4E2D\u53EF\u80FD\u6709\u85E4\u7F16\u6905\u5B50\u3001\u6728\u7EB9\u3001\u6742\u7269\u6761\u7EB9\u6216\u6298\u75D5\uFF0C\u8BF7\u4E25\u683C\u8FC7\u6EE4\u80CC\u666F\u566A\u70B9\uFF0C\u5207\u52FF\u5C06\u80CC\u666F\u7EB9\u7406\u8BEF\u8BC6\u522B\u4E3A\u5B57\u7B26\uFF01
2. \u5E38\u89C1\u8D85\u5E02/\u751F\u9C9C\u5C0F\u7968\u901A\u5E38\u91C7\u7528\u201C\u4E24\u884C\u5F0F\u201D\u6216\u201C\u5355\u884C\u5F0F\u201D\u7ED3\u6784\uFF1A
   - \u7B2C\u4E00\u884C\u901A\u5E38\u4E3A\u5546\u54C1\u540D\u79F0\u53CA\u89C4\u683C\u5355\u4F4D\uFF08\u4F8B\u5982\u201C\u5927\u767D\u83DC kg(1*1)\u201D\u3001\u201C\u9C7F\u9C7C\u5934 (\u51B0) kg(1*1)\u201D\u3001\u201C\u9762\u5B50\u5B89\u7C73\u8840300g \u888B(1*1)\u201D\u3001"\u4E91\u857E19451\u76D2\u88C5\u70F9\u8C03\u7EB8(8\u7C73) \u76D2(1"\uFF09\u3002
   - \u7B2C\u4E8C\u884C\u901A\u5E38\u4E3A\u5546\u54C1\u6761\u7801\uFF0813-14\u4F4D\u6570\u5B57\uFF09 + \u6570\u91CF + \u5355\u4EF7 + \u91D1\u989D\uFF08\u4F8B\u5982\u201C21060220078002 2.18 3.18 6.93\u201D\uFF09\u3002
   - \u5207\u52FF\u5C06\u6761\u7801\u6570\u5B57\u5F53\u505A\u5546\u54C1\u540D\u79F0\uFF01\u5FC5\u987B\u5C06\u7B2C\u4E00\u884C\u7684\u54C1\u540D\u4E0E\u7B2C\u4E8C\u884C\u7684\u6761\u7801\u3001\u6570\u91CF\u3001\u5355\u4EF7\u3001\u603B\u4EF7\u6B63\u786E\u5BF9\u5E94\uFF01
3. \u8BF7\u5B8C\u6574\u63D0\u53D6\u6240\u6709\u5546\u54C1\uFF0C\u4E0D\u8981\u9057\u6F0F\u4EFB\u4F55\u4E00\u9879\u5546\u54C1\u3002
4. \u63D0\u53D6\u5C0F\u7968\u62AC\u5934\u6216\u5E95\u90E8\u7684\u5173\u952E\u5143\u6570\u636E\uFF1A
   - storeName: \u5E97\u540D\uFF08\u5982\u6C38\u8F89\u8D85\u5E02\u3001\u5F97\u745E\u5E02\u3001\u5927\u60A6\u57CE\u5E97\u7B49\uFF0C\u82E5\u5C0F\u7968\u672A\u660E\u786E\u6CE8\u660E\u53EF\u6839\u636E\u516C\u7AE0\u6216\u7279\u5F81\u63D0\u53D6\uFF09
   - receiptNumber: \u5C0F\u7968\u6D41\u6C34\u53F7/\u5355\u53F7/\u4EA4\u6613\u53F7\uFF08\u5982\u679C\u5C0F\u7968\u6709\uFF09
   - date: \u4EA4\u6613\u65E5\u671F\uFF0C\u683C\u5F0F\u4E3A YYYY-MM-DD\uFF08\u4F8B\u5982 "2026-09-06"\uFF09
   - totalAmount: \u5E94\u4ED8\u603B\u91D1\u989D\uFF08\u4F8B\u5982 255.71\uFF09
   - totalQuantity: \u8D2D\u4E70\u603B\u6570\u91CF\u6216\u603B\u91CD\u91CF\uFF08\u4F8B\u5982 13.742\uFF09
   - itemCount: \u603B\u4EF6\u6570\uFF08\u4F8B\u5982 19\uFF09
   - rawText: \u5B8C\u6574\u7684\u5C0F\u7968\u6587\u672C\u8BC6\u522B\u7A3F\uFF08\u9010\u884C\u6574\u7406\u597D\u4FBF\u4E8E\u7528\u6237\u6838\u5BF9\uFF09
   - items: \u5546\u54C1\u5217\u8868\uFF0C\u6BCF\u4E2A\u5546\u54C1\u5305\u542B\uFF1A
     - productName: \u5546\u54C1\u540D\u79F0\uFF08\u53BB\u9664\u7EAF\u6761\u7801\u5E72\u6270\uFF0C\u4FDD\u7559\u89C4\u683C\u5982\u201C\u5927\u767D\u83DC kg(1*1)\u201D\uFF09
     - barcode: \u5546\u54C1\u6761\u7801/\u8D27\u53F7\uFF08\u5982 "21060220078002"\uFF0C\u5982\u6709\uFF09
     - quantity: \u6570\u91CF\u6216\u91CD\u91CF\uFF08\u6D6E\u70B9\u6570\uFF0C\u5982 2.18\u30010.718 \u6216 1\uFF09
     - unitPrice: \u5355\u4EF7\uFF08\u6D6E\u70B9\u6570\uFF0C\u5982 3.18\u30015.17\uFF09
     - totalPrice: \u91D1\u989D\uFF08\u6D6E\u70B9\u6570\uFF0C\u5982 6.93\u30013.71\uFF09

\u8BF7\u76F4\u63A5\u4EE5 JSON \u683C\u5F0F\u8FD4\u56DE\uFF0C\u786E\u4FDD\u6570\u5B57\u7C7B\u578B\u6B63\u786E\u3002`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            storeName: { type: import_genai.Type.STRING },
            receiptNumber: { type: import_genai.Type.STRING },
            date: { type: import_genai.Type.STRING },
            totalAmount: { type: import_genai.Type.NUMBER },
            totalQuantity: { type: import_genai.Type.NUMBER },
            itemCount: { type: import_genai.Type.INTEGER },
            rawText: { type: import_genai.Type.STRING },
            items: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  productName: { type: import_genai.Type.STRING },
                  barcode: { type: import_genai.Type.STRING },
                  quantity: { type: import_genai.Type.NUMBER },
                  unitPrice: { type: import_genai.Type.NUMBER },
                  totalPrice: { type: import_genai.Type.NUMBER }
                },
                required: ["productName", "quantity", "unitPrice", "totalPrice"]
              }
            }
          },
          required: ["items", "totalAmount"]
        }
      }
    });
    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText);
    return res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error("Scan receipt error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to scan receipt with AI"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
