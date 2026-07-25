# PeakSelf website + AI Health Coach chatbot

## What's in this folder
- `index.html` — the site, including the floating "PeakSelf Coach" chat widget
- `netlify/functions/chat.js` — serverless function that calls the Claude API (keeps your key private, server-side only)
- `netlify.toml` — tells Netlify where the function lives

## Why a serverless function?
The chatbot needs an Anthropic API key to talk to Claude. That key must **never** live in the browser-facing HTML/JS — anyone could view-source it and rack up charges on your account. The function keeps the key on Netlify's servers and the browser only ever talks to your own `/chat` endpoint.

## Deploy steps (Netlify, free tier works)

1. **Get an Anthropic API key**
   Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key. You'll need to add billing details (pay-as-you-go; a chatbot like this costs fractions of a cent per message).

2. **Push this folder to GitHub**
   Netlify Functions need to deploy from a Git repo (drag-and-drop deploy won't run the function). Create a new GitHub repo and push this folder's contents to it.

3. **Connect the repo to Netlify**
   - In Netlify: **Add new site → Import an existing project → GitHub** → pick your repo.
   - Build settings: leave build command blank, publish directory `.` (already set in `netlify.toml`).

4. **Add your API key as an environment variable**
   - In your Netlify site: **Site configuration → Environment variables → Add a variable**
   - Key: `ANTHROPIC_API_KEY`
   - Value: the key you created in step 1
   - Redeploy the site so the function picks it up.

5. **Test it**
   Visit your live `.netlify.app` URL, click the chat bubble bottom-right, and ask it something like "what's a good beginner workout?"

## Customizing the coach
Open `netlify/functions/chat.js` and edit the `SYSTEM_PROMPT` string to change its tone, add more detail about your app, or tighten what it will/won't answer.

## Cost control (optional but recommended)
Since this runs on your API key, consider:
- Setting a monthly spend cap in the Anthropic console
- Adding simple rate-limiting later if the site gets real traffic (e.g. limit to N messages per visitor per session). 
