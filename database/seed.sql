USE hotel_management;

INSERT IGNORE INTO categories (category_name, description) VALUES
('Morning', 'Breakfast and tiffin'),
('Lunch', 'Meals, rice and biryani'),
('Juices', 'Fresh juices and beverages'),
('Dinner', 'Dinner dishes'),
('Snacks', 'Quick bites and savouries'),
('Desserts', 'Sweets and desserts');

INSERT INTO menu_items (category_id, item_name, description, price, image_url, is_available)
SELECT c.category_id, v.item_name, v.description, v.price, v.image_url, TRUE
FROM (
 SELECT 'Morning' category_name,'Idli (2 pieces)' item_name,'Soft steamed idlis served with chutney.' description,40.00 price,'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=900&q=80' image_url
 UNION ALL SELECT 'Morning','Plain Dosa','Crispy South Indian dosa.',60,'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Masala Dosa','Crispy dosa with potato masala.',80,'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Ghee Roast','Golden dosa roasted with ghee.',90,'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Pongal','Comforting rice and lentil pongal.',55,'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Poori Masala','Fluffy pooris with potato masala.',70,'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Vada','Crispy medu vada.',25,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Upma','Warm semolina upma.',45,'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Morning','Chapati (2 pieces)','Soft chapatis.',40,'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','South Indian Meals','A traditional meal with rice and sides.',130,'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Veg Fried Rice','Wok-tossed rice with vegetables.',110,'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Chicken Biryani','Aromatic basmati rice and spices.',180,'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Veg Biryani','Fragrant rice with vegetables.',140,'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Lemon Rice','Tangy lemon rice.',75,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Tomato Rice','Spiced tomato rice.',75,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Curd Rice','Cooling curd rice.',65,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Sambar Rice','Rice with homestyle sambar.',70,'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Lunch','Chicken Rice','Spicy chicken fried rice.',150,'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Orange Juice','Fresh orange juice.',60,'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Watermelon Juice','Refreshing watermelon juice.',55,'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Mango Juice','Sweet mango juice.',65,'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Apple Juice','Fresh apple juice.',70,'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Pineapple Juice','Tropical pineapple juice.',60,'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Lemon Juice','Classic fresh lemon juice.',35,'https://images.unsplash.com/photo-1513558161293-cf1b7b5d8a80?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Fresh Lime Soda','Fresh lime with sparkling soda.',45,'https://images.unsplash.com/photo-1513558161293-cf1b7b5d8a80?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Milkshake','Creamy chilled milkshake.',90,'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Juices','Tea and Coffee','Hot tea or filter coffee.',25,'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Chapati','Soft chapatis.',20,'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Parotta','Flaky layered parotta.',25,'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Naan','Soft tandoor-style naan.',35,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Paneer Butter Masala','Paneer in creamy tomato gravy.',150,'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Dosa','Classic crispy dosa.',60,'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Idiyappam','Soft string hoppers.',45,'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Appam','Soft-centred appam.',45,'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Chicken Curry','Homestyle chicken curry.',160,'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Dinner','Veg Kurma','Mixed vegetables in kurma gravy.',110,'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Samosa','Crispy pastry with savoury filling.',20,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Onion Pakoda','Crunchy onion fritters.',45,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Bajji','Golden fried vegetable fritters.',35,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','French Fries','Crispy salted fries.',80,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Sandwich','Toasted sandwich with fresh filling.',75,'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Puffs','Flaky bakery puff.',25,'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Spring Rolls','Crispy vegetable spring rolls.',90,'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Snacks','Cutlet','Spiced vegetable cutlet.',35,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Gulab Jamun','Soft syrup-soaked sweet.',40,'https://images.unsplash.com/photo-1666190092159-3a1e4bdb4d1a?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Ice Cream','Creamy scoop of ice cream.',60,'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Brownie','Rich chocolate brownie.',80,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Fruit Salad','Seasonal fresh fruit salad.',70,'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Payasam','Traditional South Indian dessert.',55,'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Rasgulla','Soft spongy Bengali sweet.',40,'https://images.unsplash.com/photo-1666190092159-3a1e4bdb4d1a?auto=format&fit=crop&w=900&q=80'
 UNION ALL SELECT 'Desserts','Cake Slice','Fresh cake slice.',90,'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80'
) AS v
JOIN categories c ON c.category_name = v.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m WHERE m.category_id = c.category_id AND m.item_name = v.item_name
);
