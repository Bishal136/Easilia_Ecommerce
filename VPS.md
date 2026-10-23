MERN Stack Project Deployment Documentation on Ubuntu VPSএই ডকুমেন্টেশনে একটি Ubuntu VPS-এ ফ্রেশ এনভায়রনমেন্ট থেকে শুরু করে সম্পূর্ণ MERN Stack (MongoDB, Express, React, Node.js) প্রোজেক্ট সেটআপ, PM2 প্রসেস ম্যানেজমেন্ট, Nginx রিভার্স প্রক্সি এবং ডোমেন রাউটিংয়ের সম্পূর্ণ গাইড ধাপে ধাপে উপস্থাপন করা হলো।১. সিস্টেম প্রস্তুতি ও প্যাকেজ ইনস্টলেশনVPS-এ আপডেট দিয়ে Node.js 20 LTS, Git, Nginx এবং PM2 ইনস্টল করুন:Bash# সিস্টেম প্যাকেজ আপডেট
sudo apt update && sudo apt upgrade -y

# Node.js 20.x LTS ইনস্টলেশন
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# PM2 গ্লোবালি ইনস্টল
sudo npm install -g pm2
২. MongoDB 7.0 ডাটাবেস কনফিগারেশনডাটাবেস সার্ভিস চালু করে সিকিউর ইউজার ও রিমোট এক্সেস নিশ্চিত করুন:Bash# সার্ভিস চালু ও এনেবল করা
sudo systemctl start mongod
sudo systemctl enable mongod
২.১ অ্যাডমিন ইউজার তৈরিপাসওয়ার্ডহীন অবস্থায় শেলে প্রবেশ করে ইউজার তৈরি করুন:Bashmongosh
JavaScriptuse admin

db.createUser({
  user: "adminUser",
  pwd: "2026",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

exit
২.২ সিকিউরিটি ও বাইন্ডিং এনফোর্স/etc/mongod.conf ফাইলে অথেন্টিকেশন যুক্ত করুন:YAMLnet:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled
কনফিগ রিলোড করতে সার্ভিস রিস্টার্ট দিন:Bashsudo systemctl restart mongod
৩. প্রোজেক্ট ক্লোন ও স্ট্রাকচার সাজানো/var/www ডিরেক্টরিতে প্রোজেক্ট ক্লোন করে পারমিশন দিন:Bashcd /var/www
sudo git clone https://github.com/your-username/Easilia_Ecommerce.git Easilia_Ecommerce
sudo chown -R $USER:$USER /var/www/Easilia_Ecommerce
সাধারণ ডিরেক্টরি স্ট্রাকচার:Plaintext/var/www/Easilia_Ecommerce/
├── server/       # Backend (Node.js/Express)
└── client/       # Frontend (React/Vite)
৪. Backend (Node.js & Express) ডিপ্লয়মেন্ট৪.১ ডিপেন্ডেন্সি ও .env কনফিগারেশনBashcd /var/www/Easilia_Ecommerce/server
npm install --production
nano .env
.env ফাইলের ভেতর কনফিগারেশন যোগ করুন:Code snippetPORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://adminUser:2026@127.0.0.1:27017/easilia_db?authSource=admin
৪.২ PM2 দিয়ে ব্যাকগ্রাউন্ড সার্ভিস পরিচালনাআপনার package.json-এর স্ক্রিপ্ট অনুযায়ী সার্ভার শুরু করুন:Bashpm2 start src/server.js --name "easilia-backend"
pm2 save
pm2 startup
(টার্মিনালে দেওয়া sudo env PATH=... কমান্ডটি কপি করে পেস্ট করে নিন)।৫. Frontend (React / Vite) প্রোডাকশন বিল্ড৫.১ ক্লায়েন্ট ডিপেন্ডেন্সি ও API URLBashcd /var/www/Easilia_Ecommerce/client
npm install
nano .env.production
প্রোডাকশন এনভায়রনমেন্টে ব্যাকএন্ডের ডোমেন লিংক করুন:Code snippetVITE_API_BASE_URL=https://api.easilia.com
৫.২ প্রোডাকশন বান্ডেল তৈরি ও পারমিশনBashnpm run build
sudo chmod -R 755 /var/www/Easilia_Ecommerce/client
যাচাই: নিশ্চিত করুন /var/www/Easilia_Ecommerce/client/dist ফোল্ডারের ভেতরে index.html ও assets তৈরি হয়েছে।৬. Nginx রিভার্স প্রক্সি কনফিগারেশনFrontend এবং Backend ডোমেনের জন্য ভার্চুয়াল হোস্ট কনফিগার করুন:Bashsudo nano /etc/nginx/sites-available/Easilia_Ecommerce
নিচের সম্পূর্ণ কনফিগারেশনটি পেস্ট করুন:Nginx# WebSocket connection upgrade mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    "" close;
}

# ১. Frontend SPA (easilia.com, www.easilia.com, VPS_IP, localhost)
server {
    listen 80;
    server_name easilia.com www.easilia.com localhost 127.0.0.1;

    root /var/www/Easilia_Ecommerce/client/dist;
    index index.html;

    client_max_body_size 300M;
    client_body_buffer_size 16M;
    client_body_timeout 3600s;
    client_header_timeout 3600s;

    # Security & OAuth popup headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    add_header Cross-Origin-Resource-Policy "cross-origin" always;

    # React client-side routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static uploads directory - served directly from disk with priority
    location ^~ /uploads/ {
        root /var/www/Easilia_Ecommerce/server;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
        try_files $uri =404;
    }

    # API Reverse Proxy (points to Node.js backend on port 5010)
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:5010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Upload & long-request timeouts
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
        send_timeout 3600s;

        # Buffering for large uploads
        proxy_request_buffering on;
        proxy_buffering on;
        proxy_buffers 8 16k;
        proxy_buffer_size 16k;
    }

    # Socket.IO Real-time WebSockets
    location ^~ /socket.io/ {
        proxy_pass http://127.0.0.1:5010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
    }

    # Frontend static assets caching (CSS, JS, fonts, dist icons)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|webp|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
        try_files $uri =404;
    }
}

# ২. Backend Domain (api.easilia.com)
server {
    listen 80;
    server_name api.easilia.com;

    client_max_body_size 300M;
    client_body_buffer_size 16M;
    client_body_timeout 3600s;
    client_header_timeout 3600s;

    # Static uploads directory for direct media access from api domain
    location ^~ /uploads/ {
        root /var/www/Easilia_Ecommerce/server;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:5010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for large uploads
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
        send_timeout 3600s;

        # Buffering
        proxy_request_buffering on;
        proxy_buffering on;
        proxy_buffers 8 16k;
        proxy_buffer_size 16k;
    }
}
কনফিগ সক্রিয় করে Nginx রিস্টার্ট দিন:Bashsudo ln -sf /etc/nginx/sites-available/Easilia_Ecommerce /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
৭. ডোমেন রাউটিং ও পাবলিক এক্সেসঅপশন ক: Cloudflare Tunnel (পাবলিক আইপি ছাড়া / VMware VPS)পাবলিক আইপি ছাড়া লোকাল VPS ইন্টারনেটে লাইভ করতে /etc/cloudflared/config.yml ফাইলটি এভাবে সাজান:YAMLtunnel: <YOUR_TUNNEL_ID>
credentials-file: /root/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: easilia.com
    service: http://localhost:80
  - hostname: www.easilia.com
    service: http://localhost:80
  - hostname: api.easilia.com
    service: http://localhost:80
  - service: http_status:404
সার্ভিস রিস্টার্ট দিন:Bashsudo systemctl restart cloudflared
অপশন খ: ক্লাউড VPS (স্ট্যাটিক পাবলিক আইপিসহ)Cloudflare বা আপনার ডোমেন DNS-এ গিয়ে সরাসরি রেকর্ড যুক্ত করুন:A রেকর্ড: @ (বা easilia.com) -> VPS_PUBLIC_IPCNAME রেকর্ড: www -> easilia.comA রেকর্ড: api -> VPS_PUBLIC_IPসার্ভারে SSL সার্টিফিকেট যুক্ত করতে Certbot চালান:Bashsudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d easilia.com -d www.easilia.com -d api.easilia.com
৮. স্বাস্থ্য পরীক্ষা ও ডায়াগনস্টিক কমান্ডসার্ভারের প্রতিটি উপাদান ঠিকমতো কাজ করছে কিনা তা নিচের কমান্ডগুলো দিয়ে যাচাই করুন:কম্পোনেন্টস্ট্যাটাস চেক কমান্ডরিস্টার্ট কমান্ডBackendpm2 statuspm2 restart easilia-backendDatabasesudo systemctl status mongodsudo systemctl restart mongodWeb Serversudo systemctl status nginxsudo systemctl restart nginxTunnelsudo systemctl status cloudflaredsudo systemctl restart cloudflaredলোকাল টেস্ট:Bashcurl -I -H "Host: easilia.com" http://127.0.0.1
curl -I -H "Host: api.easilia.com" http://127.0.0.1
উভয় ক্ষেত্রে HTTP/1.1 200 OK রিটার্ন করলে আপনার পুরো MERN স্ট্যাক ইন্টারনেটে লাইভ।








