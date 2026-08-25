# Signal Desk

A personal research-job monitor for broad field searches across science, academic, higher-ed, neuroscience, and European sources.

## GitHub Pages

This is a static site and deploys with the included GitHub Actions workflow. After creating the repository, enable Pages with **GitHub Actions** as the source.

## GitHub login

GitHub Pages cannot safely perform OAuth or store cross-device user data by itself. The UI includes a Supabase Auth integration point:

1. Create a Supabase project and enable GitHub under Authentication → Providers.
2. Add the public project URL and anon key to `config.js`.
3. Add the deployed Pages URL to Supabase’s allowed redirect URLs.
4. Add the callback URL shown by Supabase to your GitHub OAuth App.

The current profile preferences work without login and are stored locally in the browser.
