import re
import xml.etree.ElementTree as etree

from django.db import models
from utils.safe_session import safe_session


class MississippiYear(models.Model):
    value = models.CharField(max_length=32, unique=True)
    text = models.CharField(max_length=64)
    is_range = models.BooleanField(default=False)
    
    def __unicode__(self):
        return u'%s' %self.value
    
    class Meta:
        
        managed = False
        db_table = 'mississippi_year'


class SiteNotFoundException(Exception):
    pass
    
# Create your models here.
nar_namespaces = {'NAR': 'http://cida.usgs.gov/NAR'}
def get_site_name(site_id, url):
    ogc_filter = """
    <ogc:Filter xmlns:ogc="https://www.opengis.net/ogc">
       <ogc:PropertyIsEqualTo>
        <ogc:PropertyName>NAR:qw_id</ogc:PropertyName>
        """
    ogc_filter += '<ogc:Literal>' + site_id +'</ogc:Literal>' + """
       </ogc:PropertyIsEqualTo>
    </ogc:Filter>
    """
    #kill all whitespace except for one-length whitespace like the spaces between xml tag names and attribute names
    ogc_filter = re.sub(r'\s{2,}', '',  ogc_filter)
    
    params = {
              'service': 'WFS',
              'version': '2.0.0',
              'request': 'GetFeature',
              'typeName': 'NAR:JD_NFSN_sites',
              'filter': ogc_filter,
    }
    session = safe_session()
    my_request = session.get(url, params=params)
    tree = etree.fromstring(my_request.content)
    numberMatchedAttributes = tree.findall("[@numberMatched='1']")
    if len(numberMatchedAttributes):
        site_name = tree.findall('*//NAR:qw_name', namespaces=nar_namespaces)[0].text
        return site_name
    else:
        raise SiteNotFoundException("Could not find site with id=" + site_id)