const UserCard = require('../models/UserCard');

// Card definitions matching frontend
const CARD_DEFINITIONS = {
  'bronze-field-card': {
    id: 'bronze-field-card',
    title: 'Bronze Field Card',
    tier: 'bronze',
    multiplier: 0.78,
    expiresLabel: 'Expires in 15 days',
    details: [
      'Rewind one misplay each match.',
      'Unlocks custom room invites for friends.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$2.99',
    coinCost: '650',
    durationDays: 15,
  },
  'silver-ward-card': {
    id: 'silver-ward-card',
    title: 'Silver Ward Card',
    tier: 'silver',
    multiplier: 0.82,
    expiresLabel: 'Expires in 20 days',
    details: [
      'Includes all Bronze perks.',
      'Squad EXP gain × 1.1 while active.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$4.99',
    coinCost: '1,100',
    durationDays: 20,
  },
  'gold-surge-card': {
    id: 'gold-surge-card',
    title: 'Gold Surge Card',
    tier: 'gold',
    multiplier: 0.86,
    expiresLabel: 'Expires in 25 days',
    details: [
      'Includes all Silver perks.',
      'Squad EXP gain × 1.2 while active.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$7.99',
    coinCost: '1,800',
    durationDays: 25,
  },
  'diamond-flux-card': {
    id: 'diamond-flux-card',
    title: 'Diamond Flux Card',
    tier: 'diamond',
    multiplier: 0.9,
    expiresLabel: 'Expires in 30 days',
    details: [
      'Includes all Gold perks.',
      'Squad EXP gain × 1.3 while active.',
      'Unlocks custom avatar uploads in profile settings.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$12.99',
    coinCost: '2,600',
    durationDays: 30,
  },
  'enterprise-nexus-card': {
    id: 'enterprise-nexus-card',
    title: 'Enterprise Nexus Card',
    tier: 'enterprise',
    multiplier: 0.94,
    expiresLabel: 'Expires in 40 days',
    details: [
      'Includes all Diamond perks.',
      'Squad EXP gain × 1.4 while active.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$16.99',
    coinCost: '3,400',
    durationDays: 40,
  },
  'mythic-singularity-card': {
    id: 'mythic-singularity-card',
    title: 'Mythic Singularity Card',
    tier: 'mythic',
    multiplier: 0.98,
    expiresLabel: 'Expires in 50 days',
    details: [
      'Includes all Enterprise perks.',
      'Squad EXP gain × 1.5 ~ 1.7 while active.',
      'Purchased with real currency via the Comet Store.',
    ],
    priceUsd: '$21.99',
    coinCost: '4,500',
    durationDays: 50,
  },
};

/**
 * Get all available cards (for shop)
 * If user is authenticated, includes ownership information
 */
const getAvailableCards = async (req, res) => {
  try {
    // Return all card definitions as products
    const allCards = Object.values(CARD_DEFINITIONS).map((cardDef) => ({
      id: cardDef.id,
      title: cardDef.title,
      tier: cardDef.tier,
      multiplier: cardDef.multiplier,
      details: cardDef.details,
      priceUsd: cardDef.priceUsd,
      coinCost: cardDef.coinCost,
      durationDays: cardDef.durationDays, // Max duration
    }));

    // If user is authenticated, include ownership info
    let ownedCardIds = [];
    if (req.user) {
      const userId = req.user._id.toString();
      const userCards = await UserCard.find({ userId });
      ownedCardIds = userCards.map((card) => card.cardId);
    }

    // Add ownership status to each card
    const cardsWithOwnership = allCards.map((card) => ({
      ...card,
      isOwned: ownedCardIds.includes(card.id),
    }));

    console.log(`[getAvailableCards] Returning ${cardsWithOwnership.length} cards (user: ${req.user ? req.user._id : 'anonymous'})`);
    res.json({
      success: true,
      data: {
        cards: cardsWithOwnership,
      },
    });
  } catch (error) {
    console.error('Get available cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available cards',
    });
  }
};

/**
 * Get user's cards (owned cards)
 */
const getUserCards = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get all user cards
    const userCards = await UserCard.find({ userId }).sort({ purchasedAt: -1 });

    // Update cards that are missing durationDays (migration for old records)
    for (const userCard of userCards) {
      if (!userCard.durationDays) {
        const cardDef = CARD_DEFINITIONS[userCard.cardId];
        if (cardDef) {
          userCard.durationDays = cardDef.durationDays;
          await userCard.save();
        }
      }
    }

    // Format cards with expiration info
    const now = new Date();
    const formattedCards = userCards.map((userCard) => {
      const cardDef = CARD_DEFINITIONS[userCard.cardId];
      if (!cardDef) {
        return null;
      }

      // Calculate remaining days
      const expiresAt = new Date(userCard.expiresAt);
      const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
      const isExpired = expiresAt < now;

      // Use stored durationDays, or fallback to card definition if missing (for old records)
      const maxDuration = userCard.durationDays || cardDef.durationDays;

      return {
        id: cardDef.id,
        title: cardDef.title,
        tier: cardDef.tier,
        multiplier: cardDef.multiplier,
        expiresLabel: isExpired ? 'Expired' : `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        details: cardDef.details,
        priceUsd: cardDef.priceUsd,
        coinCost: cardDef.coinCost,
        isActive: userCard.isActive && !isExpired,
        isExpired,
        expiresAt: userCard.expiresAt,
        purchasedAt: userCard.purchasedAt,
        durationDays: maxDuration, // Max duration (original duration when purchased)
        daysRemaining: isExpired ? 0 : daysRemaining, // Current remaining days
      };
    }).filter(Boolean);

    // Find active card
    const activeCard = formattedCards.find((card) => card.isActive) || null;
    let activeCardId = activeCard?.id || null;

    // If user has no cards, initialize with diamond card
    if (userCards.length === 0) {
      const diamondCardDef = CARD_DEFINITIONS['diamond-flux-card'];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + diamondCardDef.durationDays);

      const newCard = await UserCard.create({
        userId,
        cardId: 'diamond-flux-card',
        expiresAt,
        durationDays: diamondCardDef.durationDays, // Store max duration
        isActive: true,
      });

      activeCardId = 'diamond-flux-card';
      formattedCards.push({
        id: 'diamond-flux-card',
        title: diamondCardDef.title,
        tier: diamondCardDef.tier,
        multiplier: diamondCardDef.multiplier,
        expiresLabel: `Expires in ${diamondCardDef.durationDays} days`,
        details: diamondCardDef.details,
        priceUsd: diamondCardDef.priceUsd,
        coinCost: diamondCardDef.coinCost,
        isActive: true,
        isExpired: false,
        expiresAt: newCard.expiresAt,
        purchasedAt: newCard.purchasedAt,
        durationDays: diamondCardDef.durationDays,
        daysRemaining: diamondCardDef.durationDays,
      });
    } else if (!activeCardId) {
      // If no active card but user has cards, set default to diamond if user owns it
      const diamondCard = formattedCards.find((card) => card.id === 'diamond-flux-card' && !card.isExpired);
      if (diamondCard) {
        activeCardId = 'diamond-flux-card';
        // Auto-activate diamond card if no active card
        await UserCard.findOneAndUpdate(
          { userId, cardId: 'diamond-flux-card' },
          { isActive: true },
          { new: true }
        );
        // Deactivate other cards
        await UserCard.updateMany(
          { userId, cardId: { $ne: 'diamond-flux-card' } },
          { isActive: false }
        );
        // Update the card in formattedCards
        const diamondIndex = formattedCards.findIndex((card) => card.id === 'diamond-flux-card');
        if (diamondIndex !== -1) {
          formattedCards[diamondIndex].isActive = true;
        }
      }
    }

    res.json({
      success: true,
      data: {
        cards: formattedCards,
        activeCardId: activeCardId,
      },
    });
  } catch (error) {
    console.error('Get user cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user cards',
    });
  }
};

/**
 * Set active card
 */
const setActiveCard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required',
      });
    }

    // Verify card exists in definitions
    if (!CARD_DEFINITIONS[cardId]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card ID',
      });
    }

    // Check if user owns this card
    const userCard = await UserCard.findOne({ userId, cardId });
    if (!userCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not owned by user',
      });
    }

    // Check if card is expired
    const now = new Date();
    if (new Date(userCard.expiresAt) < now) {
      return res.status(400).json({
        success: false,
        message: 'Card has expired',
      });
    }

    // Deactivate all other cards
    await UserCard.updateMany(
      { userId, cardId: { $ne: cardId } },
      { isActive: false }
    );

    // Activate the selected card
    userCard.isActive = true;
    await userCard.save();

    res.json({
      success: true,
      message: 'Card activated successfully',
      data: {
        activeCardId: cardId,
      },
    });
  } catch (error) {
    console.error('Set active card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active card',
    });
  }
};

/**
 * Purchase a card (for future use - when payment integration is added)
 */
const purchaseCard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required',
      });
    }

    // Verify card exists in definitions
    const cardDef = CARD_DEFINITIONS[cardId];
    if (!cardDef) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card ID',
      });
    }

    // Check if user already owns this card
    const existingCard = await UserCard.findOne({ userId, cardId });
    if (existingCard) {
      // Extend expiration if card exists
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + cardDef.durationDays);
      existingCard.expiresAt = newExpiresAt;
      existingCard.durationDays = cardDef.durationDays; // Update max duration
      existingCard.purchasedAt = new Date();
      await existingCard.save();

      return res.json({
        success: true,
        message: 'Card expiration extended',
        data: {
          cardId: existingCard.cardId,
          expiresAt: existingCard.expiresAt,
        },
      });
    }

    // Create new card
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + cardDef.durationDays);

    const userCard = await UserCard.create({
      userId,
      cardId,
      expiresAt,
      isActive: false, // Don't auto-activate on purchase
    });

    res.json({
      success: true,
      message: 'Card purchased successfully',
      data: {
        cardId: userCard.cardId,
        expiresAt: userCard.expiresAt,
      },
    });
  } catch (error) {
    console.error('Purchase card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase card',
    });
  }
};

module.exports = {
  getAvailableCards,
  getUserCards,
  setActiveCard,
  purchaseCard,
};

