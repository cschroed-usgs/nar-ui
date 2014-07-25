import re
from StringIO import StringIO
import xml.etree.ElementTree as etree
import requests

class SiteNotFoundException(Exception):
    pass
    
# Create your models here.
nar_namespaces = {'NAR': 'http://cida.usgs.gov/NAR'}
def get_site_name(site_id, url):
    filter = """
    <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
       <ogc:PropertyIsEqualTo>
        <ogc:PropertyName>NAR:staid</ogc:PropertyName>
        """
    filter += '<ogc:Literal>' +site_id +'</ogc:Literal>' + """
       </ogc:PropertyIsEqualTo>
    </ogc:Filter>
    """
    #kill all whitespace except for one-length whitespace like the spaces between xml tag names and attribute names
    filter = re.sub(r'\s{2,}', '',  filter)
    
    params = {
              'service': 'WFS',
              'version': '2.0.0',
              'request': 'GetFeature',
              'typeName': 'NAR:NAWQA100_cy3fsmn',
              'filter': filter,
    }
    
    my_request = requests.get(url, params=params)
    tree = etree.fromstring(my_request.content)
    numberMatchedAttributes = tree.findall("[@numberMatched='1']")
    if len(numberMatchedAttributes):
        site_name = tree.findall('*//NAR:staname', namespaces=nar_namespaces)[0].text
        return site_name
    else:
        raise SiteNotFoundException("Could not find site with id=" + site_id)