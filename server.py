import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

PORT = 8080
SCORES_FILE = 'scores.json'

class LeaderboardHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/leaderboard':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            scores = []
            if os.path.exists(SCORES_FILE):
                with open(SCORES_FILE, 'r') as f:
                    try:
                        scores = json.load(f)
                    except json.JSONDecodeError:
                        pass
            
            # Sort descending and get top 10
            scores.sort(key=lambda x: int(x.get('score', 0)), reverse=True)
            response_data = {
                "top_10": scores[:10],
                "total_records": len(scores)
            }
            self.wfile.write(json.dumps(response_data).encode())
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/score':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                name = data.get('name')
                score = data.get('score')
                
                if not name or score is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error": "Invalid data"}')
                    return
                
                scores = []
                if os.path.exists(SCORES_FILE):
                    with open(SCORES_FILE, 'r') as f:
                        try:
                            scores = json.load(f)
                        except json.JSONDecodeError:
                            pass
                
                scores.append({'name': str(name), 'score': int(score)})
                scores = sorted(scores, key=lambda x: x.get('score', 0), reverse=True)
                
                with open(SCORES_FILE, 'w') as f:
                    json.dump(scores, f, indent=2)
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), LeaderboardHandler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()
