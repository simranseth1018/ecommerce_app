package com.example.shop.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequest {
    private String productName;
    private Long categoryId;
    private String category;
    private Long price;
}
