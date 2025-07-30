// Mock Groups 資料
const mockGroups = [
  {
    id: 1,
    name: '簡少年老師 2025 拜拜推薦',
    description: '簡少年老師精選2025年最重要的拜拜時機，涵蓋開運、求財、祈福等各種需求',
    enabled: true,
    video_url: 'https://www.youtube.com/watch?v=example123',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  },
  {
    id: 2,
    name: '基礎民俗節慶',
    description: '台灣傳統民俗節慶基本清單，適合初學者',
    enabled: true,
    video_url: null,
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  }
];

// Groups 與 Events 的對應關係
const mockGroupItems = {
  1: [1, 2], // 簡少年老師推薦：媽祖聖誕 + 清明節
  2: [2]     // 基礎民俗節慶：清明節
};

module.exports = {
  mockGroups,
  mockGroupItems
};