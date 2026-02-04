from django.shortcuts import render, redirect
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from .models import Product, Order
import requests
broadcast_url = "http://localhost:3001/transaction/broadcast"
mine_url = "http://localhost:3001/mine"




@login_required
def home(request):
    if request.user.groups.filter(name = "farmer").exists():
        products = Product.objects.all()
        return render(request, "home.html", context={"products":products})
    else:
        return redirect ('unauthorized.html')

@login_required
def product_detail(request, product_id):
    product = Product.objects.get(pk = product_id)
    if request.method == 'POST':
        quantity = request.POST.get("quantity")
        delivery_location = request.POST.get("delivery_location")
        order = Order(farmer = request.user, product = product, quantity = quantity, delivery_location = delivery_location, status = "pending")
        order.save()
        return redirect ("fish_feed:home")
    return render (request,"productDetail.html", context={"product": product})
    
@login_required
def distributor_dashboard(request):
    if request.user.groups.filter(name="distributor").exists():

        products = Product.objects.filter(distributor=request.user)

        pending_orders = Order.objects.filter(
            status="pending",
            product__distributor=request.user
        )

        accepted_orders = Order.objects.filter(
            status="accepted",
            product__distributor=request.user
        )

        return render(
            request,
            "distributor_dashboard.html",
            {
                "products": products,
                "pending_orders": pending_orders,
                "accepted_orders": accepted_orders
            }
        )

    return render(request, "unauthorized.html")



@login_required  
def add_product(request):
    if request.method == 'POST':
        distributor = request.user
        product_name = request.POST.get("product_name")
        product_description = request.POST.get("product_description")
        feed_type = request.POST.get("feed_type")
        price = request.POST.get("price")
        exp_date = request.POST.get("exp_date")
        quantity_available = request.POST.get("quantity_available")
        product_thumbnail = request.FILES.get("product_thumbnail")

        new_product = Product(distributor = distributor, product_name = product_name, product_description = product_description, feed_type = feed_type, price = price, exp_date = exp_date, quantity_available = quantity_available, product_thumbnail=product_thumbnail)
        new_product.save()
        return redirect("fish_feed:distributor_dashboard")
    return render (request, "addProduct.html")

@login_required
def delete_product(request, product_id):
    product = Product.objects.get(pk = product_id)
    product.delete()
    return redirect ("fish_feed:distributor_dashboard")

@login_required
def edit_product(request, product_id):
    product = Product.objects.get(pk = product_id)
    if request.method == 'POST':
        product.product_name = request.POST.get("product_name")
        product.product_description = request.POST.get("product_description")
        product.feed_type = request.POST.get("feed_type")
        product.price = request.POST.get("price")
        product.exp_date = request.POST.get("exp_date")
        product.quantity_available = request.POST.get("quantity_available")
        product.product_thumbnail = request.FILES.get("product_thumbnail")
        product.save()
        return redirect ("fish_feed:distributor_dashboard")
    return render(request, "editProduct.html", context={"product": product})



@login_required
def accept_order(request, order_id):
    accepted_order = Order.objects.get(pk=order_id)
    accepted_order.status = "accepted"
    accepted_order.save()
    if accepted_order.quantity <= accepted_order.product.quantity_available:
        data = {
            "order_id":accepted_order.id,
            "distributor": accepted_order.product.distributor.username,
            "farmer": accepted_order.farmer.username,
            "quantity": accepted_order.quantity,
            "price": float(accepted_order.product.price),
            "feed_type": accepted_order.product.feed_type,
            "exp_date": str(accepted_order.product.exp_date),
            "order_status": "success",
            "delivery_location": accepted_order.delivery_location,
            "product_name": accepted_order.product.product_name
        }

    try:
        tx_res = requests.post(broadcast_url, json=data, timeout=5)
        tx_res.raise_for_status()

        mine_res = requests.get(mine_url, timeout=5)
        mine_res.raise_for_status()

    except requests.exceptions.RequestException as e:

        accepted_order.status = "pending"
        accepted_order.save()


        print("Blockchain API error:", e)


    return redirect("fish_feed:distributor_dashboard")


@login_required
def decline_order(request, order_id):
    declined_order = Order.objects.get(pk=order_id)
    declined_order.status = "declined"
    declined_order.save()
    return redirect ("fish_feed:distributor_dashboard")


@login_required
def verify_blockchain(request, order_id):
    verify_url = f"http://localhost:3001/verify-order/{order_id}"

    try:
        response = requests.get(verify_url, timeout=5)
        data = response.json()
    except Exception as e:
        data = {
            "found": False,
            "error": "Could not connect to blockchain node.",
            "details": str(e)
        }

    return render(
        request,
        "verify_blockchain.html",
        context={"blockchain_response": data, "order_id": order_id}
    )



@login_required
def farmer_orders(request):
    # Get orders that belong to the currently logged-in user
    orders = Order.objects.filter(farmer=request.user).order_by('-created_at')
    return render(request, "farmer_orders.html", {"orders": orders})

