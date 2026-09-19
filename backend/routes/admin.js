const express = require('express');
const router = express.Router();

let siteSettings = {
  siteName: 'Fashionvillaroyal',
  maintenanceMode: false,
  announcementText: 'We are available in Meesho, Flipkart, Amazon & Custom Stores.',
  supportEmail: 'fhub0021@gmail.com',
  carouselSlides: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
      title: 'Royal Ethnic Collection 2026',
      subtitle: 'Up to 60% OFF on Sarees, Suits & Kurties',
      badgeText: 'Trending Now',
      linkUrl: '#catalogSection',
      buttonText: 'Shop Collection'
    }
  ],
  offerBanners: [
    {
      title: 'Festive Special Offer',
      description: 'Flat ₹200 OFF on your first purchase above ₹999',
      code: 'FASHION200',
      discountText: 'FLAT ₹200 OFF'
    }
  ]
};

let registeredSellers = [
  { id: 'sel_1', name: 'Surat Textile Hub', email: 'surat_seller@gmail.com', storeName: 'Royal Surat Sarees', status: 'Approved', joined: '2026-08-15' },
  { id: 'sel_2', name: 'Jaipur Kurti House', email: 'jaipur_kurti@gmail.com', storeName: 'Jaipur Craft Hub', status: 'Pending', joined: '2026-09-01' },
  { id: 'sel_3', name: 'Royal Fashion Direct', email: 'royal_direct@gmail.com', storeName: 'Royal Outlets', status: 'Approved', joined: '2026-09-05' }
];

router.get('/settings', async (req, res) => {
  res.json({ success: true, settings: siteSettings });
});

router.put('/settings', async (req, res) => {
  if (req.body) siteSettings = { ...siteSettings, ...req.body };
  res.json({ success: true, message: 'Settings updated!', settings: siteSettings });
});

router.post('/toggle-maintenance', async (req, res) => {
  siteSettings.maintenanceMode = !siteSettings.maintenanceMode;
  res.json({ success: true, message: `Maintenance mode is now ${siteSettings.maintenanceMode ? 'ENABLED' : 'DISABLED'}`, maintenanceMode: siteSettings.maintenanceMode });
});

router.get('/sellers', async (req, res) => {
  res.json({ success: true, count: registeredSellers.length, sellers: registeredSellers });
});

router.put('/sellers/:id/status', async (req, res) => {
  const { status } = req.body;
  const seller = registeredSellers.find(s => s.id === req.params.id);
  if (seller) {
    seller.status = status;
    return res.json({ success: true, message: `Seller status updated to ${status}`, seller });
  }
  res.status(404).json({ success: false, message: 'Seller not found.' });
});

router.delete('/sellers/:id', async (req, res) => {
  registeredSellers = registeredSellers.filter(s => s.id !== req.params.id);
  res.json({ success: true, message: 'Seller account deleted.' });
});

router.get('/stats', async (req, res) => {
  res.json({
    success: true,
    stats: {
      totalProducts: 12,
      totalOrders: 5,
      totalSellers: registeredSellers.length,
      totalRevenue: 15400,
      maintenanceMode: siteSettings.maintenanceMode
    }
  });
});

module.exports = router;
