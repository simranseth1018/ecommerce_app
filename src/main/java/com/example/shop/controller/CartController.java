//package com.example.shop.controller;
//
//import com.example.shop.model.CartItem;
//import com.example.shop.service.CartService;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/cart")
//@CrossOrigin
//public class CartController {
//
//    private final CartService cartService;
//
//    public CartController(CartService cartService) {
//        this.cartService = cartService;
//    }
//
//    @PostMapping("/add")
//    public String addToCart(@RequestBody CartItem item) {
//        cartService.addToCart(item);
//        return "Added to cart";
//    }
//
//    @GetMapping
//    public List<CartItem> getCart() {
//        return cartService.getCart();
//    }
//
//    @DeleteMapping("/clear")
//    public String clearCart() {
//        cartService.clearCart();
//        return "Cart cleared";
//    }
//}