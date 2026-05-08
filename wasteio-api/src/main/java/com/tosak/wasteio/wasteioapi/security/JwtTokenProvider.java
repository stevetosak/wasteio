package com.tosak.wasteio.wasteioapi.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {
    
    private final SecretKey key;
    private final long jwtExpiration;
    
    public JwtTokenProvider(
                @Value("${jwt.secret}") String jwtSecret,
                @Value("${jwt.expiration}") long jwtExpiration){
        this.jwtExpiration = jwtExpiration;
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
            
    
    
    public String generateToken(String email){
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }
    
    public boolean validateToken(String token){
        try{
            Jwts.parser().verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e ){
            log.error("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }
    
    public String getEmailFromToken(String token){
        try{
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (JwtException e){
            log.error("Failed to extract email from token: {}", e.getMessage());
            return null;
        }
    }
    
}
