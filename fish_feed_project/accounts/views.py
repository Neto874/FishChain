from django.shortcuts import render, redirect
from django.contrib.auth.models import User, Group
from django.contrib.auth import login, authenticate, logout


def signup(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        role = request.POST.get('role')

        if password1 != password2:
            return render(request, "signup.html", {
                "error": "Passwords do not match.",
                "email": email,
                "username": username,
                "role": role,
            })

        if User.objects.filter(username=username).exists():
            return render(request, "signup.html", {
                "error": "Username already exists.",
                "email": email,
                "role": role,
            })

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1
        )

        if role == "distributor":
            group = Group.objects.get(name="distributor")
            user.groups.add(group)
            login(request,user)
            return redirect("fish_feed:distributor_dashboard")

        elif role == "farmer":
            group = Group.objects.get(name="farmer")
            user.groups.add(group)
            login(request,user)
            return redirect("fish_feed:home")

        else:
            return render(request, "signup.html", {
                "error": "Invalid role selected."
            })

    return render(request, "signup.html")

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request,username = username, password = password)
        if user is not None:
            login(request, user)
            if user.groups.filter(name = "distributor").exists():
                return redirect ("fish_feed:distributor_dashboard")
            else:
                return redirect("fish_feed:home")
        else:
            return render (request, "login.html", {"error": "invalid login credentials"})
    return render (request, "login.html")

def logout_view(request):
    logout(request)
    return redirect("accounts:login")




    

