package com.example.shop.service;

import com.example.shop.dto.ProductRequest;
import com.example.shop.entity.Product;
import com.example.shop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product create(ProductRequest productRequest){
        Product product = new Product();
        product.setProductName(productRequest.getProductName());
        product.setCategory(productRequest.getCategory());
        product.setPrice(productRequest.getPrice());
        return productRepository.save(product);
    }

    public List<Product> getAll(){
        return productRepository.findAll();
    }

    public Product getById(Long id){
        return productRepository.findById(id).orElse(null);
    }

    public Product update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) return null;

        product.setProductName(request.getProductName());
        product.setCategoryId(request.getCategoryId());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());

        return productRepository.save(product);
    }

    public void delete(Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product != null) {
            product.setActive(false);
            productRepository.save(product);
        }
    }



}


