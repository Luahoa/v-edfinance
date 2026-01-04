#!/usr/bin/env tsx

/**
 * Test script to verify YouTube API key works
 * Run: npx tsx scripts/test-youtube-api.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API key...\n');

  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log(`✅ API key found: ${YOUTUBE_API_KEY.substring(0, 10)}...`);

  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'snippet,contentDetails',
          id: TEST_VIDEO_ID,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      console.log('\n✅ YouTube API key is VALID!\n');
      console.log('📹 Test Video Details:');
      console.log(`   Title: ${video.snippet.title}`);
      console.log(`   Channel: ${video.snippet.channelTitle}`);
      console.log(`   Duration: ${video.contentDetails.duration}`);
      console.log(`   Thumbnail: ${video.snippet.thumbnails.default.url}`);
      console.log('\n🎉 YouTube integration is ready to use!');
    } else {
      console.error('❌ No video found (API key might be invalid)');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ YouTube API Error:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.error.message}`);
      
      if (error.response.status === 403) {
        console.error('\n💡 Possible issues:');
        console.error('   - API key is invalid or revoked');
        console.error('   - YouTube Data API v3 is not enabled');
        console.error('   - IP/domain restrictions blocking request');
        console.error('   - Quota exceeded (check Google Cloud Console)');
      }
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testYouTubeAPI();
