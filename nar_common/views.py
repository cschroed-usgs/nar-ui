
import requests

from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.views.generic import View

from helpcontent.models import Definition


class NarDBHealthServiceView(View):
    
    def get(self, request, *args, **kwargs):
        try:
            all_defs = Definition.objects.all()
        except Exception as value:
            return HttpResponseServerError(value)
        else:
            if len(all_defs) > 0:
                return HttpResponse('{"status" : "good"}', content_type='application/json')
            else:
                return HttpResponseServerError("Unexpected database contents : Definition table is empty");
            
            
class GeoserverHealthServiceView(View):
    
    def get(self, request, *args, **kwargs):  
        url = 'https://' + settings.GEOSERVER_HOST_NAME + settings.GEOSERVER_PATH + 'wms'
        req = requests.get(url,
                           params = {
                                     'service' : 'WMS',
                                     'version' : '2.0.0',
                                     'request' : 'GetCapabilities'
        })
        if req.status_code == 200:
            return HttpResponse('{"status" : "good"}', content_type='application/json')
        else:
            return HttpResponseServerError(url + ' returned ' + str(req.status_code))
        
        
class SosHealthServiceView(View):
    
    def get(self, request, *args, **kwargs):
        url = 'https://' + settings.SOS_HOST_NAME + settings.SOS_PATH
        req = requests.get(url, params = {
                                          'request' : 'GetDataAvailability',
                                          'service' : 'SOS',
                                          'version' : '2.0.0'
        });
        if req.status_code == 200:
            return HttpResponse('{"status" : "good"}', content_type='application/json')
        else:
            return HttpResponseServerError(url + ' returned ' + str(req.status_code))
        