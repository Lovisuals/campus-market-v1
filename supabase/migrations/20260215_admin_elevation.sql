-- Phase 12: Hardcoded Admin Elevation

UPDATE public.users 
SET is_admin = true 
WHERE 
  email IN ('mail.lovisuals@gmail.com', 'vitalbytesventures@gmial.com', 'olawalopeyemi18@gmail.com')
  OR 
  phone IN ('08083000771', '09153095464', '+2348083000771', '+2349153095464');
