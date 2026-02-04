from django.urls import path,include
from . import views

app_name = "fish_feed"
urlpatterns = [
    path("", views.home, name="home"),
    path("distributor_dashboard/", views.distributor_dashboard, name="distributor_dashboard"),
    path("addProduct/",views.add_product, name="add_product" ),
    path("editProduct/<int:product_id>/",views.edit_product, name="edit_product" ),
    path("deleteProduct/<int:product_id>/",views.delete_product, name="delete_product" ),
    path("productDetail/<int:product_id>/",views.product_detail, name="product_detail" ),
    path("acceptOrder/<int:order_id>/",views.accept_order, name="accept_order" ),
    path("declineOrder/<int:order_id>/",views.decline_order, name="decline_order" ),
    path("verifyBlockchain/<int:order_id>/",views.verify_blockchain, name="verify_blockchain" ),
    path("my_orders/", views.farmer_orders, name="farmer_orders"),

]