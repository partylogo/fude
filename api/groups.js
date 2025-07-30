// Groups API Handler
const { mockGroups, mockGroupItems } = require('../data/mockGroups');
const mockEvents = require('../data/mockEvents');
const GroupsService = require('../services/groupsService');

const groupsHandler = (req, res) => {
  try {
    // 取得所有啟用的群組
    const enabledGroups = GroupsService.getAllGroups(mockGroups);
    
    res.status(200).json({
      groups: enabledGroups
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const groupDetailHandler = (req, res) => {
  try {
    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(req.params.id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 取得群組詳細資訊
    const group = GroupsService.getGroupById(mockGroups, validation.id);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const groupItemsHandler = (req, res) => {
  try {
    // 驗證群組 ID
    const validation = GroupsService.validateGroupId(req.params.id);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // 檢查群組是否存在
    const group = GroupsService.getGroupById(mockGroups, validation.id);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found'
      });
    }

    // 取得群組事件並分類
    const groupEvents = GroupsService.getGroupEvents(validation.id, mockGroupItems, mockEvents);
    const groupedEvents = GroupsService.groupEventsByType(groupEvents);

    res.status(200).json(groupedEvents);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  groupsHandler,
  groupDetailHandler,
  groupItemsHandler
};