const CommunityEvent = require('../models/CommunityEvent');
const Crew = require('../models/Crew');

/**
 * Get community data (events, crews, Discord info)
 */
const getCommunityData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get active community events (community beats) with pagination
    const [events, totalEvents] = await Promise.all([
      CommunityEvent.find({ isActive: true })
        .sort({ eventDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CommunityEvent.countDocuments({ isActive: true }),
    ]);

    // Get active crews (no pagination for crews, keep limit of 10)
    const crews = await Crew.find({ isActive: true })
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Format events
    const formattedEvents = events.map((event) => ({
      title: event.title,
      detail: event.detail,
      prizeCoins: event.prizeCoins > 0 ? event.prizeCoins.toLocaleString() : null,
      eventDate: event.eventDate,
    }));

    // Format crews
    const formattedCrews = crews.map((crew) => ({
      name: crew.name,
      focus: crew.focus,
      members: crew.memberCount >= 1000 
        ? `${(crew.memberCount / 1000).toFixed(1)}K members`
        : `${crew.memberCount} members`,
    }));

    // Discord invite URL (can be configured via env)
    const discordInvite = process.env.DISCORD_INVITE_URL || 'https://discord.gg/cometgamehouse';
    const discordServerName = process.env.DISCORD_SERVER_NAME || 'Comet GameHouse HQ';
    const discordActive = process.env.DISCORD_ACTIVE_STATUS || '24/7 active';

    return res.json({
      success: true,
      data: {
        discord: {
          inviteUrl: discordInvite,
          serverName: discordServerName,
          activeStatus: discordActive,
        },
        events: formattedEvents,
        crews: formattedCrews,
        total: totalEvents,
      },
    });
  } catch (error) {
    console.error('Get community data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load community data',
    });
  }
};

module.exports = {
  getCommunityData,
};

