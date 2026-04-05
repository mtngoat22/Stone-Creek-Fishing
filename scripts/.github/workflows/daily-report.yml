name: Daily Fishing Report

on:
  schedule:
    # Runs every day at 7am Utah time (1pm UTC)
    - cron: '0 13 * * *'
  workflow_dispatch: # lets you run it manually too

jobs:
  post-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install @supabase/supabase-js node-fetch@2
      - name: Run daily report
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/daily-report.js
