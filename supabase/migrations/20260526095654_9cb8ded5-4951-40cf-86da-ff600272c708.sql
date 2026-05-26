
-- Add Naberezhnye Chelny dealer warehouse
INSERT INTO warehouses (code,name,city,sort_order,is_active)
VALUES ('chelny','Склад Дилера Набережные Челны (КАМАВТОКОМПЛЕКТ)','Набережные Челны',8,true)
ON CONFLICT (code) DO NOTHING;

-- Insert any missing brands
INSERT INTO brands (slug,name) VALUES
('cnhtc','CNHTC'),('xgma','XGMA'),('howo','HOWO'),('china','CHINA'),('zg-link','ZG.Link'),
('shaanxi','Shaanxi'),('hyva','HYVA'),('prc','PRC'),('sinotruk','SINOTRUK'),('shacman','Shacman'),
('dong-feng','Dong Feng'),('zf','ZF'),('yuchai','Yuchai'),('bosch','Bosch'),('weichai','Weichai'),
('cummins','Cummins'),('deutz','Deutz'),('sdlg','SDLG'),('lonking','Lonking'),('xcmg','XCMG'),
('fuller','Fuller'),('faw','FAW'),('liugong','LiuGong'),('shanghai','Shanghai'),('mahle','MAHLE'),
('sdec','SDEC'),('huatai','Huatai'),('shantui','Shantui'),('qinyan','QINYAN'),('wabco','WABCO'),
('vdo','VDO'),('gross-parts','GROSS PARTS'),('changlin','Changlin'),('no-brand','No Brand'),
('doosan','Doosan'),('denso','Denso'),('oem','OEM'),('gross','Gross'),('foton','Foton'),
('camc','CAMC'),('weifu','WeiFu'),('valeo','Valeo'),('sachs','Sachs'),('leo-trade','LEO TRADE'),
('sitrak','Sitrak'),('volvo','Volvo'),('holset','Holset'),('borgwarner','BorgWarner'),
('fleetguard','FLEETGUARD'),('donaldson','Donaldson'),('sakura','Sakura'),('baldwin','BALDWIN'),
('sorl','SORL'),('zoomlion','Zoomlion')
ON CONFLICT (slug) DO NOTHING;

-- Staging tables for price-list import (will be dropped at the end)
DROP TABLE IF EXISTS public._imp_prod;
DROP TABLE IF EXISTS public._imp_stock;
CREATE TABLE public._imp_prod (brand_name text, sku text, name text, price numeric(12,2), out_only boolean);
CREATE TABLE public._imp_stock (brand_name text, sku text, wh_code text, qty integer);
GRANT INSERT, SELECT, TRUNCATE ON public._imp_prod, public._imp_stock TO public;
