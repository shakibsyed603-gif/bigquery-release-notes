import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch the feed XML with a User-Agent header
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(FEED_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        # Parse XML data
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', namespace):
            title_el = entry.find('atom:title', namespace)
            updated_el = entry.find('atom:updated', namespace)
            id_el = entry.find('atom:id', namespace)
            content_el = entry.find('atom:content', namespace)
            link_el = entry.find('atom:link', namespace)
            
            title = title_el.text if title_el is not None else 'BigQuery Update'
            updated = updated_el.text if updated_el is not None else ''
            id_val = id_el.text if id_el is not None else ''
            content_text = content_el.text if content_el is not None else ''
            
            # Extract link href if available
            link_href = ''
            if link_el is not None:
                link_href = link_el.attrib.get('href', '')
            
            # Simple date parsing (YYYY-MM-DD)
            date_str = updated.split('T')[0] if updated else title
            
            entries.append({
                'id': id_val,
                'title': title,
                'updated': updated,
                'date': date_str,
                'content': content_text,
                'link': link_href
            })
            
        return entries, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'notes': entries})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
