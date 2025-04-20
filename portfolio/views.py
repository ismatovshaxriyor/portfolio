from django.http import JsonResponse
from django.shortcuts import render
from .models import ContactMessage

def index(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        message = request.POST.get('message')

        if name and email and phone and message:
            ContactMessage.objects.create(
                name=name,
                email=email,
                phone=phone,
                message=message
            )
            return JsonResponse({'success': True, 'message': 'Your message has been saved successfully!'})
        else:
            return JsonResponse({'success': False, 'message': 'Barcha maydonlarni to‘ldiring.'})

    return render(request, 'index.html')
