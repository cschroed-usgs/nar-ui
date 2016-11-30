from django.views.generic.base import TemplateView
from django.http import Http404
from django.conf import settings
import models
from nar_ui.models import SiteNotFoundException, MississippiYear


class HomePageView(TemplateView):
    template_name = 'nar_ui/home.html' 

#abstract class:
class SiteReportView(TemplateView):    
    
    def get_context_data(self, **kwargs):        
        context = super(SiteReportView, self).get_context_data(**kwargs)
        site_id = context.get('site_id', '01646580')
        url = 'https://' + settings.GEOSERVER_HOST_NAME + settings.GEOSERVER_PATH + 'wfs'
        try:
            site_name = models.get_site_name(site_id, url)
            context['site_name'] = site_name
            return context
        except SiteNotFoundException, e:
            raise Http404
        
 
class SiteSummaryReportView(SiteReportView):
    template_name = 'nar_ui/summary.html'
    
class SiteFullReportView(SiteReportView):
    template_name = 'nar_ui/full_report.html'
    
class SiteView(TemplateView):
    template_name = 'nar_ui/site.html'
    
    
class MississippiView(TemplateView):
    template_name = 'nar_ui/mississippi.html'
    
    def get_context_data(self, **kwargs):
        context = super(MississippiView, self).get_context_data(**kwargs)
        context['year_pick_list'] = MississippiYear.objects.all().order_by('is_range', 'text')
        return context
    
    
class CoastalView(TemplateView):
    template_name = 'nar_ui/coastal.html'

class CoastalRegionView(TemplateView):
    template_name = 'nar_ui/region_coastal.html'
    
class DownloadView(TemplateView):
    template_name = 'nar_ui/download.html'
    
class Nasqan1996View(TemplateView):
    template_name = 'nar_ui/nasqan_1996_stations.html'
    
class natFactView(TemplateView):
    template_name = 'nar_ui/nat_fact_sheet.html'
    
class missFactView(TemplateView):
    template_name = 'nar_ui/miss_fact_sheet.html'
    
class coFactView(TemplateView):
    template_name = 'nar_ui/co_fact_sheet.html'
    
class clmbFactView(TemplateView):
    template_name = 'nar_ui/clmb_fact_sheet.html'
    
class riogrndFactView(TemplateView):
    template_name = 'nar_ui/riogrnd_fact_sheet.html'
    
class Nasqan2001View(TemplateView):
    template_name = 'nar_ui/2001_2007_station_list.html'
    
class YukonFactView(TemplateView):
    template_name = 'nar_ui/yukon_fact_sheet.html'
    
class representativeSamplingView(TemplateView):
    template_name = 'nar_ui/representative_sampling.html'
        
class AlaskaSldView(TemplateView):
    content_type = "text/xml; charset=utf-8"
    template_name = 'nar_ui/slds/alaska_sites.sld'
    
class GulfSldView(TemplateView):
    content_type = "text/xml; charset=utf-8"
    template_name = 'nar_ui/slds/gulf_sites.sld'
    
class NortheastSldView(TemplateView):
    content_type = "text/xml; charset=utf-8"
    template_name = 'nar_ui/slds/ne_sites.sld'
    
class SoutheastSldView(TemplateView):
    content_type = "text/xml; charset=utf-8"
    template_name = 'nar_ui/slds/se_sites.sld'
    
class WestSldView(TemplateView):
    content_type = "text/xml; charset=utf-8"
    template_name = 'nar_ui/slds/west_sites.sld'
    
    
