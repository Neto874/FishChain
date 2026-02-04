from django.db import models
from django.contrib.auth.models import User

class Product (models.Model):
    distributor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    product_name = models.CharField(max_length=125)
    feed_type = models.CharField(max_length=125)
    price = models.IntegerField()
    exp_date = models.CharField(max_length=125)
    quantity_available = models.IntegerField()
    product_thumbnail = models.ImageField(upload_to="server_images/", blank=True, null=True)
    product_description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"distributor: {self.distributor} product name: {self.product_name}"


class Order (models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders')
    quantity = models.IntegerField()
    delivery_location = models.CharField(max_length=125)
    status = models.CharField(max_length=125)
    created_at = models.DateField(auto_now= True)

    def __str__(self):
        return f"farmer: {self.farmer} order product: {self.product}"
