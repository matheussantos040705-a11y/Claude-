# Aspect Ratios & Framing Formats

The code animation engine natively supports any canvas dimensions. Configure width and height in `src/config.js`.

---

## 1. Supported Presets

| Format | Dimensions | Best For | `src/config.js` |
|---|---|---|---|
| **16:9 Landscape** | `1920 × 1080` | YouTube, presentations, documentary shorts | `width: 1920, height: 1080` |
| **9:16 Vertical** | `1080 × 1920` | TikTok, Instagram Reels, YouTube Shorts | `width: 1080, height: 1920` |
| **1:1 Square** | `1080 × 1080` | Instagram feed, Twitter, avatars, loop cards | `width: 1080, height: 1080` |
| **21:9 Ultrawide** | `2560 × 1080` | Cinematic banners, hero landing pages | `width: 2560, height: 1080` |

---

## 2. Staging for 9:16 Vertical Video (Shorts & Reels)

Vertical framing requires distinct composition principles:

1. **Keep the "Safe Zone" in Mind:**
   - On TikTok and Instagram Reels, platform UI controls cover the bottom 25% (captions, audio title, profile handle) and right 15% (like/share buttons).
   - Place primary character action and expressive faces in the vertical center: between `y = 600` and `y = 1300`.
2. **Vertical Camera Movement:**
   - In 16:9, cameras pan horizontally. In 9:16, camera moves feel dramatic when tilting vertically:
     ```javascript
     // Tilting up from ground to towering subject
     camBegin(W / 2, lerp(H * 0.75, H * 0.35, ease(lt / dur)), 1.0);
     ```
3. **Stacked Staging:**
   - Instead of arranging characters left-and-right, stage them vertically: a character in the foreground below looking up at a bird, star, or balloon above.

---

## 3. Staging for 16:9 Landscape

- Place horizon lines at the rule-of-thirds: lower third (`y ≈ 720`) for expansive sky/night shots, or upper third (`y ≈ 360`) to emphasize the landscape terrain.
- Establish screen direction early: if a character travels screen-right in shot A, continue screen-right in shot B unless an explicit about-face occurs.
